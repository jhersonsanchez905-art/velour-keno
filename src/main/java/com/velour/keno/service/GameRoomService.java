package com.velour.keno.service;
import com.velour.keno.dto.GameResultResponse;
import com.velour.keno.dto.GameRoomResponse;
import com.velour.keno.entity.GameRoom;
import com.velour.keno.entity.GameRoomPlayer;
import com.velour.keno.entity.User;
import com.velour.keno.exception.InsufficientBalanceException;
import com.velour.keno.exception.ResourceNotFoundException;
import com.velour.keno.repository.GameRoomPlayerRepository;
import com.velour.keno.repository.GameRoomRepository;
import com.velour.keno.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameRoomService {
    private final GameRoomRepository roomRepository;
    private final GameRoomPlayerRepository playerRepository;
    private final UserRepository userRepository;
    private final KenoLogicService kenoLogicService;
    private final SimpMessagingTemplate messagingTemplate;

    /**
    * Crear una nueva sala de juego
    */
    @Transactional
    public GameRoom createRoom() {
        GameRoom room = GameRoom.builder()
            .status("WAITING")
            .maxPlayers(5)
            .minPlayers(3)
            .currentPlayers(0)
            .roundNumber(1)
            .build();
        room = roomRepository.save(room);
        log.info("Sala creada: {}", room.getId());
        return room;
    }

    /**
    * Obtener salas disponibles para unirse
    */
    public List<GameRoomResponse> getAvailableRooms() {
        List<GameRoom> rooms = roomRepository.findAvailableRooms();
        return rooms.stream()
            .map(this::mapToRoomResponse)
            .collect(Collectors.toList());
    }

    /**
    * Un jugador se une a una sala
    */
    @Transactional
    public GameRoomPlayer joinRoom(Long roomId, String username) {
        GameRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada: " + roomId));
    
        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + username));

        // Verificar que la sala está abierta
        if (!"WAITING".equals(room.getStatus())) {
            throw new IllegalStateException("La sala ya no acepta jugadores");
        }

        // Verificar que no está llena
        if (room.getCurrentPlayers() >= room.getMaxPlayers()) {
            throw new IllegalStateException("La sala está llena");
        }

        // Verificar que el usuario no esté ya en una sala activa
        if (playerRepository.isUserInActiveRoom(user)) {
            throw new IllegalStateException("Ya estás en una sala activa");
        }

        // Crear registro del jugador en la sala
        GameRoomPlayer player = GameRoomPlayer.builder()
            .room(room)
            .user(user)
            .status("CHOOSING")
            .build();
        player = playerRepository.save(player);

        // Actualizar contador de jugadores
        room.setCurrentPlayers(room.getCurrentPlayers() + 1);
        roomRepository.save(room);

        log.info("Jugador {} se unió a la sala {}", username, roomId);

        // Notificar a todos en la sala
        broadcastPlayers(roomId);
        // Notificar al lobby
        broadcastRooms();

        return player;
    }

    /**
    * Un jugador envía su selección de números y apuesta
    */
    @Transactional
    public void submitPlay(Long roomId, String username,List<Integer> selectedNumbers, BigDecimal betAmount) {
        
        GameRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada"));

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        GameRoomPlayer player = playerRepository.findByRoomAndUser(room, user)
            .orElseThrow(() -> new ResourceNotFoundException("No estás en esta sala"));

        // Validar números seleccionados
        if (!kenoLogicService.validateSelection(selectedNumbers)) {
            throw new IllegalArgumentException("Selección inválida: elige entre 1 y 10 números del 1 al 80");
        }
        // Validar saldo suficiente
        if (user.getBalance().compareTo(betAmount) < 0) {
            throw new InsufficientBalanceException("Saldo insuficiente. Tienes: " + user.getBalance());
        }

        // Descontar apuesta del saldo
        user.setBalance(user.getBalance().subtract(betAmount));
        userRepository.save(user);
        // Guardar selección del jugador
        player.setSelectedNumbers(
        kenoLogicService.numbersToString(selectedNumbers));
        player.setBetAmount(betAmount);
        player.setStatus("READY");
        playerRepository.save(player);
        log.info("Jugador {} apostó {} en sala {}",
        username, betAmount, roomId);
        // Notificar actualización de jugadores
        broadcastPlayers(roomId);
    }
    
    /**
    * Ejecutar el sorteo de una sala
    * (llamado por el RoomScheduler cuando el timer llega a 0)
    */
    @Transactional
    public void executeDraw(Long roomId) {
        GameRoom room = roomRepository.findById(roomId)
            .orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada"));
        
        // Verificar mínimo de jugadores listos
        List<GameRoomPlayer> readyPlayers =
        playerRepository.findByRoomAndStatus(room, "READY");
        if (readyPlayers.size() < room.getMinPlayers()) {
            log.info("Sala {} no tiene suficientes jugadores ({}). Timer reiniciado.",roomId, readyPlayers.size());
            // No ejecutar sorteo, la sala sigue en WAITING
            return;
        }
        // Bloquear sala
        room.setStatus("LOCKED");
        room.setLockedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Cambiar estado a DRAWING
        room.setStatus("DRAWING");
        roomRepository.save(room);

        // Generar los 20 números del sorteo
        List<Integer> drawnNumbers = kenoLogicService.generateDraw();
        room.setDrawnNumbers(kenoLogicService.numbersToString(drawnNumbers));

        // Enviar números uno a uno via WebSocket (para animación)
        for (int i = 0; i < drawnNumbers.size(); i++) {
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/draw",
                Map.of("number", drawnNumbers.get(i), "index", i)
            );
        }
        // Calcular resultados para cada jugador
        List<GameResultResponse.PlayerResult> results = readyPlayers.stream().map(player -> {
            List<Integer> selected = kenoLogicService.stringToNumbers(player.getSelectedNumbers());
            int hits = kenoLogicService.calculateHits(selected, drawnNumbers);
            BigDecimal prize = kenoLogicService.calculatePrize(
                player.getBetAmount(), selected.size(), hits);
            int multiplier = kenoLogicService.getMultiplier(selected.size(), hits);

            // Actualizar jugador
            player.setHits(hits);
            player.setWinAmount(prize);
            player.setMultiplier(BigDecimal.valueOf(multiplier));
            player.setStatus("FINISHED");
            playerRepository.save(player);

            // Sumar premio al saldo del usuario
            if (prize.compareTo(BigDecimal.ZERO) > 0) {
                User user = player.getUser();
                user.setBalance(user.getBalance().add(prize));
                userRepository.save(user);
                log.info("Jugador {} ganó {} en sala {}", user.getUsername(), prize, roomId);
            }

            return GameResultResponse.PlayerResult.builder()
                    .userId(player.getUser().getId())
                    .username(player.getUser().getUsername())
                    .selectedNumbers(selected)
                    .hits(hits)
                    .betAmount(player.getBetAmount())
                    .winAmount(prize)
                    .multiplier(BigDecimal.valueOf(multiplier))
                    .isWinner(prize.compareTo(BigDecimal.ZERO) > 0)
                    .build();
        }).collect(Collectors.toList());

        // Marcar sala como terminada
        room.setStatus("FINISHED");
        room.setFinishedAt(LocalDateTime.now());
        roomRepository.save(room);

        // Enviar resultados a todos los jugadores
        GameResultResponse response = GameResultResponse.builder()
                .roomId(roomId)
                .drawnNumbers(drawnNumbers)
                .results(results)
                .build();
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/results", response);

        log.info("Sorteo completado en sala {}: {}", roomId, drawnNumbers);
    }

    /**
     * Obtener o crear sala disponible (para el lobby)
     */
    @Transactional
    public GameRoom getOrCreateAvailableRoom() {
        return roomRepository.findFirstByStatusOrderByCreatedAtDesc("WAITING").orElseGet(this::createRoom);
    }

    /**
     * Broadcast: enviar lista de jugadores actualizada a la sala
     */
    public void broadcastPlayers(Long roomId) {
        GameRoom room = roomRepository.findById(roomId).orElse(null);
        if (room == null) return;

        GameRoomResponse response = mapToRoomResponse(room);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/players", response);
    }
    /**
     * Broadcast: enviar lista de salas actualizada al lobby
     */
    public void broadcastRooms() {
        List<GameRoomResponse> rooms = getAvailableRooms();
        messagingTemplate.convertAndSend("/topic/rooms", rooms);
    }

    /**
    * Broadcast: enviar timer a todos en la sala
    */
    public void broadcastTimer(Long roomId, int secondsRemaining) {
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/timer", Map.of("seconds", secondsRemaining));
    }
    /**
    * Mapear entidad GameRoom a DTO
    */
    private GameRoomResponse mapToRoomResponse(GameRoom room) {
        List<GameRoomPlayer> players = playerRepository.findByRoom(room);
        List<GameRoomResponse.PlayerInfo> playerInfos = players.stream().map(p -> GameRoomResponse.PlayerInfo.builder()
            .userId(p.getUser().getId())
            .username(p.getUser().getUsername())
            .status(p.getStatus())
            .hits(p.getHits())
            .winAmount(p.getWinAmount() != null ? p.getWinAmount().toString() : null)
            .build())
        .collect(Collectors.toList());
    
        return GameRoomResponse.builder()
            .id(room.getId())
            .status(room.getStatus())
            .currentPlayers(room.getCurrentPlayers())
            .maxPlayers(room.getMaxPlayers())
            .minPlayers(room.getMinPlayers())
            .roundNumber(room.getRoundNumber())
            .players(playerInfos)
            .createdAt(room.getCreatedAt())
            .build();
    }
}
