package com.velour.keno.repository;
import com.velour.keno.entity.ChatMessage;
import com.velour.keno.entity.GameRoom;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    // Últimos N mensajes de una sala (ordenados por fecha)
    List<ChatMessage> findByRoomOrderBySentAtDesc(GameRoom room, Pageable pageable);
    // Todos los mensajes de una sala ordenados cronológicamente
    List<ChatMessage> findByRoomOrderBySentAtAsc(GameRoom room);
    // Contar mensajes en una sala
    long countByRoom(GameRoom room);
}