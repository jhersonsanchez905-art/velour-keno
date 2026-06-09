package com.velour.keno.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
@Entity
@Table(name = "game_rooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRoom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // Estado de la sala: WAITING, LOCKED, DRAWING, FINISHED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "WAITING";
    // Números sorteados (se llenan cuando el sorteo ocurre)
    // Formato: "3,7,12,15,22,..." (20 números separados por coma)
    @Column(name = "drawn_numbers", length = 100)
    private String drawnNumbers;
    // Máximo de jugadores permitidos en la sala
    @Column(name = "max_players", nullable = false)
    @Builder.Default
    private Integer maxPlayers = 5;
    // Mínimo de jugadores para iniciar el sorteo
    @Column(name = "min_players", nullable = false)
    @Builder.Default
    private Integer minPlayers = 3;
    // Cantidad actual de jugadores en la sala
    @Column(name = "current_players", nullable = false)
    @Builder.Default
    private Integer currentPlayers = 0;
    // Número de ronda (se incrementa con cada sorteo)
    @Column(name = "round_number", nullable = false)
    @Builder.Default
    private Integer roundNumber = 1;

    // Fecha de creación de la sala
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    // Fecha en que la sala se bloqueó (timer llegó a 0)
    @Column(name = "locked_at")
    private LocalDateTime lockedAt;
    // Fecha en que terminó el sorteo
    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}