package com.ayd.ventas;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record VentaRequest(@NotNull Long libroId, @Min(1) int cantidad) {
}
