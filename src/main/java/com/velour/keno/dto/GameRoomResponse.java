package com.velour.keno.dto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameRoomResponse {
    private Long id;
    private String status;
    private Integer currentPlayers;
    private Integer maxPlayers;
    private Integer minPlayers;
    private Integer roundNumber;
    private List<PlayerInfo> players;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlayerInfo {
    private Long userId;
    private String username;
    private String status; // CHOOSING, READY, PLAYING, FINISHED
    private Integer hits;
    private String winAmount;
    }
}