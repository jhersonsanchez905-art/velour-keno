package com.velour.keno.controller;

import com.velour.keno.dto.*;
import com.velour.keno.entity.GameRoom;
//import com.velour.keno.entity.GameRoomPlayer;
import com.velour.keno.service.ChatService;
import com.velour.keno.service.GameRoomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
//import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class GameRoomController {
    private final GameRoomService roomService;
    private final ChatService chatService;

    // ============ ENDPOINTS REST ============
    // GET /api/rooms — lista de salas disponibles
    @GetMapping
    public ResponseEntity<List<GameRoomResponse>> getAvailableRooms() {
        return ResponseEntity.ok(roomService.getAvailableRooms());
    }

    // POST /api/rooms — crear sala o obtener una disponible
    @PostMapping
    public ResponseEntity<Map<String, Object>> getOrCreateRoom() {
        GameRoom room = roomService.getOrCreateAvailableRoom();
        return ResponseEntity.ok(Map.of("roomId", room.getId(),"status", room.getStatus()));
    }

    // POST /api/rooms/{id}/join — unirse a una sala
    @PostMapping("/{id}/join")
    public ResponseEntity<Map<String, String>> joinRoom(@PathVariable Long id, @AuthenticationPrincipal UserDetails userDetails) {
        roomService.joinRoom(id, userDetails.getUsername());
        return ResponseEntity.ok(Map.of("mensaje", "Te has unido a la sala " + id));
    }

    // ============ ENDPOINTS WEBSOCKET ============

    // Recibir jugada via WebSocket
    @MessageMapping("/room.play")
    public void handlePlay(@Valid RoomPlayRequest request, Principal principal) {
        roomService.submitPlay(
            request.getRoomId(),
            principal.getName(),
            request.getSelectedNumbers(),
            request.getBetAmount()
        );
    }

    // Recibir mensaje de chat via WebSocket
    @MessageMapping("/room.chat")
    public void handleChat(@Valid RoomChatRequest request, Principal principal) {
        chatService.sendMessage(
            request.getRoomId(),
            principal.getName(),
            request.getMessage()
        );
    }
}