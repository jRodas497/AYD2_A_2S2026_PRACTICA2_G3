package com.ayd.libros;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record LibroRequest(
        @NotBlank @Size(max = 200) String titulo,
        @NotBlank @Size(max = 150) String autor,
        @NotNull @DecimalMin("0.00") BigDecimal precio,
        @Min(0) int existencias) {
}
