package com.velour.keno.repository;
import com.velour.keno.entity.GameRoom;
import com.velour.keno.entity.GameRoomPlayer;
import com.velour.keno.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface GameRoomPlayerRepository extends JpaRepository<GameRoomPlayer, Long> {
    // Todos los jugadores de una sala
    List<GameRoomPlayer> findByRoom(GameRoom room);
    // Buscar jugador específico en una sala
    Optional<GameRoomPlayer> findByRoomAndUser(GameRoom room, User user);
    // Verificar si un usuario ya está en una sala
    boolean existsByRoomAndUser(GameRoom room, User user);
    // Contar jugadores en una sala
    long countByRoom(GameRoom room);
    // Jugadores que ya enviaron su jugada (estado READY)
    List<GameRoomPlayer> findByRoomAndStatus(GameRoom room, String status);
    // Verificar si un usuario está en alguna sala activa
    @org.springframework.data.jpa.repository.Query(
        "SELECT COUNT(p) > 0 FROM GameRoomPlayer p " + "WHERE p.user = :user AND p.room.status IN ('WAITING', 'LOCKED', 'DRAWING')"
    )
    boolean 
    isUserInActiveRoom(@org.springframework.data.repository.query.Param("user") User user);
}