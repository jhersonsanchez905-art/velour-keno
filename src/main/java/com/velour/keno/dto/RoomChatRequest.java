package com.velour.keno.dto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
@Data
public class RoomChatRequest {
    private Long roomId;
    
    @NotBlank(message = "El mensaje no puede estar vacío")
    @Size(max = 200, message = "El mensaje no puede exceder 200 caracteres")
    private String message;
}