package com.velour.keno.service;

import com.velour.keno.dto.LoginRequest;
import com.velour.keno.dto.RegisterRequest;
import com.velour.keno.dto.UserResponse;
import com.velour.keno.entity.User;
import com.velour.keno.exception.UserAlreadyExistsException;
import com.velour.keno.repository.UserRepository;
import com.velour.keno.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public UserResponse register(RegisterRequest request) {

        // Verificar que las contraseñas coincidan
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException(
                    "Las contraseñas no coinciden");
        }

        // Verificar username único
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UserAlreadyExistsException(
                    "El username '" + request.getUsername() + "' ya está en uso");
        }

        // Verificar email único
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new UserAlreadyExistsException(
                    "El email '" + request.getEmail() + "' ya está registrado");
        }

        // Crear usuario con saldo inicial de 1000 créditos
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .provider("LOCAL")
                .build();

        User saved = userRepository.save(user);
        log.info("Nuevo usuario registrado: {}", saved.getUsername());

        return mapToUserResponse(saved);
    }

    public Map<String, Object> login(LoginRequest request) {

        // Autenticar con Spring Security
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsernameOrEmail(),
                        request.getPassword()
                )
        );

        // Generar JWT
        String token = jwtTokenProvider.generateToken(authentication);

        // Buscar datos del usuario
        User user = userRepository
                .findByUsernameOrEmail(
                        request.getUsernameOrEmail(),
                        request.getUsernameOrEmail())
                .orElseThrow();

        log.info("Login exitoso: {}", user.getUsername());

        // Construir respuesta con token y datos del usuario
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("type", "Bearer");
        response.put("user", mapToUserResponse(user));

        return response;
    }

    public UserResponse getMe(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException(
                        "Usuario no encontrado: " + username));
        return mapToUserResponse(user);
    }

    // Mapear entidad a DTO — nunca exponer entidad directamente
    private UserResponse mapToUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .balance(user.getBalance())
                .role(user.getRole())
                .createdAt(user.getCreatedAt())
                .build();
    }
}