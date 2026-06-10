package com.velour.keno.service;

import com.velour.keno.dto.UserResponse;
import com.velour.keno.entity.User;
import com.velour.keno.exception.ResourceNotFoundException;
import com.velour.keno.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private static final Set<BigDecimal> PAQUETES_VALIDOS = Set.of(
            BigDecimal.valueOf(500),
            BigDecimal.valueOf(1000),
            BigDecimal.valueOf(5000),
            BigDecimal.valueOf(10000)
    );

    private final UserRepository userRepository;

    /**
     * Recarga créditos en la cuenta del usuario.
     *
     * @param username Nombre del usuario.
     * @param amount   Monto a recargar.
     * @return UserResponse con los datos actualizados.
     * @throws IllegalArgumentException   Si el monto no es un paquete válido.
     * @throws ResourceNotFoundException  Si el usuario no existe.
     */
    @Transactional
    public UserResponse rechargeCredits(String username, BigDecimal amount) {
        if (!PAQUETES_VALIDOS.contains(amount)) {
            throw new IllegalArgumentException(
                    "Paquete no válido. Opciones: 500, 1000, 5000, 10000");
        }

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado: " + username));

        user.setBalance(user.getBalance().add(amount));
        userRepository.save(user);

        log.info("Recarga de {} créditos para {}", amount, username);

        return mapToResponse(user);
    }

    /**
     * Obtiene el perfil completo del usuario.
     *
     * @param username Nombre del usuario.
     * @return UserResponse con los datos del perfil.
     * @throws ResourceNotFoundException Si el usuario no existe.
     */
    @Transactional(readOnly = true)
    public UserResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Usuario no encontrado: " + username));
        return mapToResponse(user);
    }

    /**
     * Obtiene el saldo del usuario (sinónimo de getProfile).
     *
     * @param username Nombre del usuario.
     * @return UserResponse con el saldo incluido.
     */
    @Transactional(readOnly = true)
    public UserResponse getBalance(String username) {
        return getProfile(username);
    }

    /**
     * Mapea una entidad User a un DTO UserResponse.
     * Nunca exponer la entidad directamente al cliente.
     *
     * @param user Entidad User.
     * @return DTO UserResponse.
     */
    private UserResponse mapToResponse(User user) {
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
