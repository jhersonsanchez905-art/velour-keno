package com.velour.keno.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación con el usuario que jugó
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Sala donde se jugó esta partida (puede ser null para partidas individuales)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private GameRoom room;
    
    // Números seleccionados por el jugador (ej: "3,15,22,45,67")
    @Column(name = "selected_numbers", nullable = false, length = 50)
    private String selectedNumbers;

    // 20 números sorteados por el sistema
    @Column(name = "drawn_numbers", nullable = false, length = 100)
    private String drawnNumbers;

    // Cantidad de aciertos
    @Column(nullable = false)
    private Integer hits;

    // Monto apostado
    @Column(name = "bet_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal betAmount;

    // Premio ganado (0 si no ganó)
    @Column(name = "win_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal winAmount;

    // Multiplicador aplicado
    @Column(precision = 10, scale = 2)
    private BigDecimal multiplier;

    @CreationTimestamp
    @Column(name = "played_at", updatable = false)
    private LocalDateTime playedAt;
}