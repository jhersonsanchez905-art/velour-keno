package com.velour.keno.scheduler;

import com.velour.keno.entity.GameRoom;
import com.velour.keno.repository.GameRoomRepository;
import com.velour.keno.service.GameRoomService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class RoomScheduler {

    private final GameRoomRepository roomRepository;
    private final GameRoomService roomService;
    
    // Timer por sala: roomId → segundos restantes
    private final Map<Long, Integer> roomTimers = new ConcurrentHashMap<>();

    // Duración del timer en segundos (3 minutos 30 segundos)
    private static final int ROUND_DURATION = 210;

    /**
    * Se ejecuta cada segundo. Gestiona los timers de todas las salas.
    */
    @Scheduled(fixedRate = 1000)
    public void tickTimers() {
        List<GameRoom> waitingRooms = roomRepository.findByStatus("WAITING");
        
        for (GameRoom room : waitingRooms) {
            Long roomId = room.getId();
            // Inicializar timer si es nuevo
            roomTimers.putIfAbsent(roomId, ROUND_DURATION);
            // Decrementar timer
            int remaining = roomTimers.get(roomId) - 1;
            roomTimers.put(roomId, remaining);
            // Broadcast del timer a la sala
            roomService.broadcastTimer(roomId, remaining);
            // Timer llegó a 0
            if (remaining <= 0) {
                log.info("Timer agotado en sala {}", roomId);
                roomTimers.remove(roomId);

                // Intentar ejecutar sorteo
                roomService.executeDraw(roomId);

                // Si la sala quedó FINISHED, crear una nueva
                GameRoom updated = roomRepository.findById(roomId).orElse(null);
                if (updated != null && "FINISHED".equals(updated.getStatus())) {
                    // Esperar 10 segundos, luego crear nueva sala
                    // (simplificado: crear inmediatamente)
                    roomService.createRoom();
                    roomService.broadcastRooms();
                } else {
                    // No hubo suficientes jugadores, reiniciar timer
                    roomTimers.put(roomId, ROUND_DURATION);
                }
            }
        }
    }

    /**
    * Asegurar que siempre haya al menos una sala disponible
    * Se ejecuta cada 30 segundos
    */
    @Scheduled(fixedDelay = 5000)
    public void ensureAvailableRoom() {
        List<GameRoom> available = roomRepository.findAvailableRooms();
        if (available.isEmpty()) {
            log.info("No hay salas disponibles. Creando una nueva...");
            roomService.createRoom();
            roomService.broadcastRooms();
        }
    }
}