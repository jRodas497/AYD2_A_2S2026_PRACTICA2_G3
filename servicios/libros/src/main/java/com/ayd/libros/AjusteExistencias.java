package com.ayd.libros;

import jakarta.validation.constraints.NotNull;

/** Cambio relativo: negativo descuenta (una venta), positivo repone. */
public record AjusteExistencias(@NotNull Integer delta) {
}
