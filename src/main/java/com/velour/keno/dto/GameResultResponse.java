package com.velour.keno.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameResultResponse {
    private Long roomId;
    private List<Integer> drawnNumbers;
    private List<PlayerResult> results;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerResult {
        private Long userId;
        private String username;
        private List<Integer> selectedNumbers;
        private Integer hits;
        private BigDecimal betAmount;
        private BigDecimal winAmount;
        private BigDecimal multiplier;
        private boolean isWinner; // true si ganó algo
    }
}