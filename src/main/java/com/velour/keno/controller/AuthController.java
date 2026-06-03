package com.velour.keno.controller;

import com.velour.keno.dto.LoginRequest;
import com.velour.keno.dto.RegisterRequest;
import com.velour.keno.dto.UserResponse;
import com.velour.keno.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        UserResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request) {

        Map<String, Object> response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    // POST /api/auth/logout
    // Con JWT stateless el logout se maneja en el frontend
    // eliminando el token del almacenamiento local
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        return ResponseEntity.ok(Map.of(
                "mensaje", "Sesión cerrada correctamente"
        ));
    }

    // GET /api/auth/me
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getMe(
            @AuthenticationPrincipal UserDetails userDetails) {

        UserResponse response = authService.getMe(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}