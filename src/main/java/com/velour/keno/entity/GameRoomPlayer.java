package com.velour.keno.entity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;
@Entity
@Table(name = "game_room_players")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameRoomPlayer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // Sala a la que pertenece este jugador
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private GameRoom room;
    // Usuario que está jugando
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    // Números seleccionados por el jugador (ej: "7,15,23,44,67")
    @Column(name = "selected_numbers", length = 50)
    private String selectedNumbers;
    // Monto apostado por el jugador
    @Column(name = "bet_amount", precision = 10, scale = 2)
    private BigDecimal betAmount;
    // Cantidad de aciertos (se calcula después del sorteo)
    @Column
    private Integer hits;
    // Premio ganado (se calcula después del sorteo)
    @Column(name = "win_amount", precision = 10, scale = 2)
    private BigDecimal winAmount;
    //multiplicador aplicado
    @Column(precision = 10, scale = 2)
    private BigDecimal multiplier;
    // Estado del jugador: CHOOSING, READY, PLAYING, FINISHED
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "CHOOSING";

    // Momento en que se unió a la sala
    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private LocalDateTime joinedAt;
}