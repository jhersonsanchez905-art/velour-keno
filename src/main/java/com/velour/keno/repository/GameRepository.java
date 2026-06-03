package com.velour.keno.repository;

import com.velour.keno.entity.Game;
import com.velour.keno.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface GameRepository extends JpaRepository<Game, Long> {

    // Historial paginado de un usuario
    Page<Game> findByUserOrderByPlayedAtDesc(User user, Pageable pageable);

    // Todas las partidas de un usuario (para estadísticas)
    List<Game> findByUser(User user);

    // Total apostado por un usuario
    @Query("SELECT COALESCE(SUM(g.betAmount), 0) FROM Game g WHERE g.user = :user")
    BigDecimal sumBetAmountByUser(@Param("user") User user);

    // Total ganado por un usuario
    @Query("SELECT COALESCE(SUM(g.winAmount), 0) FROM Game g WHERE g.user = :user")
    BigDecimal sumWinAmountByUser(@Param("user") User user);

    // Últimas N partidas de un usuario (para números calientes/fríos)
    List<Game> findTop50ByUserOrderByPlayedAtDesc(User user);

    // Contar partidas de un usuario
    long countByUser(User user);
}