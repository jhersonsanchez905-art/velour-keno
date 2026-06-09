package com.velour.keno.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

/**
 * DTO para solicitar una recarga de créditos en la cuenta del usuario.
 */
@Data
public class RechargeRequest {

    @NotNull(message = "El monto de recarga es obligatorio")
    @Positive(message = "El monto debe ser un valor positivo")
    private BigDecimal amount;
}
