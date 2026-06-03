package com.velour.keno.repository;

import com.velour.keno.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Buscar usuario por username
    Optional<User> findByUsername(String username);

    // Buscar usuario por email
    Optional<User> findByEmail(String email);

    // Verificar si existe un username
    boolean existsByUsername(String username);

    // Verificar si existe un email
    boolean existsByEmail(String email);

    // Buscar por username o email (para login flexible)
    Optional<User> findByUsernameOrEmail(String username, String email);
}