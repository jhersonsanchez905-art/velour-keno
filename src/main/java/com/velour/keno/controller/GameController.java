package com.velour.keno.controller;

import com.velour.keno.entity.Game;
import com.velour.keno.entity.User;
import com.velour.keno.exception.ResourceNotFoundException;
import com.velour.keno.repository.GameRepository;
import com.velour.keno.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
public class GameController {

    private final GameRepository gameRepository;
    private final UserRepository userRepository;

    /**
     * Obtiene el usuario autenticado o lanza excepción.
     */
    private User getAuthenticatedUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado: " + username));
    }

    /**
     * Convierte una entidad Game a un Map para la respuesta JSON.
     */
    private Map<String, Object> gameToMap(Game game) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", game.getId());
        map.put("selectedNumbers", game.getSelectedNumbers());
        map.put("drawnNumbers", game.getDrawnNumbers());
        map.put("hits", game.getHits());
        map.put("betAmount", game.getBetAmount());
        map.put("winAmount", game.getWinAmount());
        map.put("multiplier", game.getMultiplier());
        map.put("playedAt", game.getPlayedAt());
        return map;
    }

    // GET /api/game/history
    @GetMapping("/history")
    public ResponseEntity<List<Map<String, Object>>> getHistory(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getAuthenticatedUser(userDetails.getUsername());
        List<Game> games = gameRepository.findByUserOrderByPlayedAtDesc(user);

        List<Map<String, Object>> result = new ArrayList<>();
        for (Game game : games) {
            result.add(gameToMap(game));
        }

        return ResponseEntity.ok(result);
    }

    // GET /api/game/history/{id}
    @GetMapping("/history/{id}")
    public ResponseEntity<Map<String, Object>> getGameDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getAuthenticatedUser(userDetails.getUsername());

        Game game = gameRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Partida no encontrada: " + id));

        // Verificar que la partida pertenece al usuario autenticado
        if (!game.getUser().getId().equals(user.getId())) {
            throw new ResourceNotFoundException(
                    "Partida no encontrada: " + id);
        }

        return ResponseEntity.ok(gameToMap(game));
    }

    // GET /api/game/stats
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {

        User user = getAuthenticatedUser(userDetails.getUsername());
        List<Game> games = gameRepository.findByUser(user);

        int totalGames = games.size();
        BigDecimal totalBet = BigDecimal.ZERO;
        BigDecimal totalWon = BigDecimal.ZERO;
        BigDecimal bestWin = BigDecimal.ZERO;
        int totalHits = 0;
        int totalSelected = 0;

        for (Game game : games) {
            totalBet = totalBet.add(game.getBetAmount() != null
                    ? game.getBetAmount() : BigDecimal.ZERO);
            totalWon = totalWon.add(game.getWinAmount() != null
                    ? game.getWinAmount() : BigDecimal.ZERO);

            if (game.getWinAmount() != null
                    && game.getWinAmount().compareTo(bestWin) > 0) {
                bestWin = game.getWinAmount();
            }

            totalHits += game.getHits() != null ? game.getHits() : 0;

            if (game.getSelectedNumbers() != null) {
                totalSelected += game.getSelectedNumbers().split(",").length;
            }
        }

        BigDecimal netBalance = totalWon.subtract(totalBet);

        BigDecimal hitRatio = BigDecimal.ZERO;
        if (totalSelected > 0) {
            hitRatio = BigDecimal.valueOf(totalHits)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalSelected), 1, RoundingMode.HALF_UP);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalGames", totalGames);
        stats.put("totalBet", totalBet);
        stats.put("totalWon", totalWon);
        stats.put("netBalance", netBalance);
        stats.put("bestWin", bestWin);
        stats.put("hitRatio", hitRatio);

        log.info("Estadísticas consultadas para {}", user.getUsername());
        return ResponseEntity.ok(stats);
    }
}
