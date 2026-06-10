package com.velour.keno.service;

import com.velour.keno.entity.ChatMessage;
import com.velour.keno.entity.GameRoom;
import com.velour.keno.entity.User;
import com.velour.keno.exception.ResourceNotFoundException;
import com.velour.keno.repository.ChatMessageRepository;
import com.velour.keno.repository.GameRoomRepository;
import com.velour.keno.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatMessageRepository chatRepository;
    private final GameRoomRepository roomRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
    * Enviar mensaje al chat de una sala
    */
    @Transactional
    public void sendMessage(Long roomId, String username, String messageText) {
        GameRoom room = roomRepository.findById(roomId).orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada"));

        User user = userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));

        // Guardar mensaje en BD
        ChatMessage chatMessage = ChatMessage.builder()
            .room(room)
            .user(user)
            .message(messageText)
            .build();
        chatRepository.save(chatMessage);

        // Broadcast del mensaje a todos en la sala
        messagingTemplate.convertAndSend(
            "/topic/room/" + roomId + "/chat",
            Map.of(
                "userId", user.getId(),
                "username", user.getUsername(),
                "message", messageText,
                "sentAt", chatMessage.getSentAt().toString()
            )
        );
        log.debug("Chat sala {}: {} → {}", roomId, username, messageText);
    }

    /**
    * Obtener últimos 50 mensajes de una sala
    */
    public List<ChatMessage> getRecentMessages(Long roomId) {
        GameRoom room = roomRepository.findById(roomId).orElseThrow(() -> new ResourceNotFoundException("Sala no encontrada"));
        return chatRepository.findByRoomOrderBySentAtDesc(room, PageRequest.of(0, 50));
    }
}