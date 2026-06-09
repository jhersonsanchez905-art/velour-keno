package com.velour.keno.repository;
import com.velour.keno.entity.GameRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
@Repository
public interface GameRoomRepository extends JpaRepository<GameRoom, Long> {
    // Buscar salas en estado WAITING (disponibles para unirse)
    List<GameRoom> findByStatus(String status);
    // Buscar salas activas (WAITING o LOCKED)
    @Query("SELECT r FROM GameRoom r WHERE r.status IN ('WAITING', 'LOCKED') ORDER BY r.createdAt DESC")
    List<GameRoom> findActiveRooms();

    // Buscar salas con espacio disponible
    @Query("SELECT r FROM GameRoom r WHERE r.status = 'WAITING' AND r.currentPlayers < r.maxPlayers ORDER BY r.createdAt ASC")
    List<GameRoom> findAvailableRooms();
    // Buscar la sala más reciente en estado WAITING
    Optional<GameRoom> findFirstByStatusOrderByCreatedAtDesc(String status);
    // Contar salas activas
    long countByStatusIn(List<String> statuses);
}