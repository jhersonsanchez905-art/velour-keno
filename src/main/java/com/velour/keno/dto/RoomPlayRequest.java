package com.velour.keno.dto;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;
@Data
public class RoomPlayRequest {
    private Long roomId;

    @NotNull(message = "Debes seleccionar al menos un número")
    @Size(min = 1, max = 10, message = "Selecciona entre 1 y 10 números")
    private List<Integer> selectedNumbers;
    
    @NotNull(message = "La apuesta es obligatoria")
    @DecimalMin(value = "10", message = "La apuesta mínima es 10 créditos")
    @DecimalMax(value = "1000", message = "La apuesta máxima es 1000 créditos")
    private BigDecimal betAmount;
}