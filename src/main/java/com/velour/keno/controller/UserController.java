package com.velour.keno.controller;

import com.velour.keno.dto.RechargeRequest;
import com.velour.keno.dto.UserResponse;
import com.velour.keno.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET /api/user/profile
    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getProfile(
            @AuthenticationPrincipal UserDetails userDetails) {

        UserResponse response = userService.getProfile(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // GET /api/user/balance
    @GetMapping("/balance")
    public ResponseEntity<UserResponse> getBalance(
            @AuthenticationPrincipal UserDetails userDetails) {

        UserResponse response = userService.getBalance(userDetails.getUsername());
        return ResponseEntity.ok(response);
    }

    // POST /api/user/recharge
    @PostMapping("/recharge")
    public ResponseEntity<UserResponse> recharge(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody RechargeRequest request) {

        UserResponse response = userService.rechargeCredits(
                userDetails.getUsername(), request.getAmount());
        log.info("Créditos recargados para {}", userDetails.getUsername());
        return ResponseEntity.ok(response);
    }
}
