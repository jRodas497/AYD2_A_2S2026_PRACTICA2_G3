package com.ayd.ventas;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

/** Única llamada entre servicios: pedirle a Libros que descuente (o devuelva) existencias. */
@Component
public class LibrosClient {

    public record Libro(Long id, String titulo, String autor, BigDecimal precio, int existencias) {
    }

    private final RestClient http;

    public LibrosClient(@Value("${libros.url}") String url) {
        // Sin timeouts, una caída de Libros dejaría colgadas las peticiones de venta. Se usa el cliente
        // del JDK porque HttpURLConnection (la fábrica "simple") no soporta PATCH.
        JdkClientHttpRequestFactory fabrica = new JdkClientHttpRequestFactory(
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build());
        fabrica.setReadTimeout(Duration.ofSeconds(5));
        this.http = RestClient.builder().baseUrl(url).requestFactory(fabrica).build();
    }

    /** Devuelve el libro ya con las existencias descontadas. */
    public Libro descontar(Long libroId, int cantidad) {
        return ajustar(libroId, -cantidad);
    }

    public void devolver(Long libroId, int cantidad) {
        ajustar(libroId, cantidad);
    }

    private Libro ajustar(Long libroId, int delta) {
        try {
            return http.patch()
                    .uri("/api/libros/{id}/existencias", libroId)
                    .body(Map.of("delta", delta))
                    .retrieve()
                    .body(Libro.class);
        } catch (RestClientResponseException e) {
            // 404 y 409 de Libros se propagan tal cual; cualquier otro código es un fallo de Libros.
            HttpStatusCode estado = e.getStatusCode();
            if (estado.value() == 404 || estado.value() == 409) {
                throw new ResponseStatusException(estado, mensaje(e));
            }
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Libros respondió " + estado.value());
        } catch (ResourceAccessException e) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "No se pudo contactar al servicio de Libros");
        }
    }

    private String mensaje(RestClientResponseException e) {
        try {
            Map<?, ?> cuerpo = e.getResponseBodyAs(Map.class);
            if (cuerpo != null && cuerpo.get("message") != null) {
                return cuerpo.get("message").toString();
            }
        } catch (RuntimeException ignorada) {
            // Sin cuerpo legible se usa el texto genérico de abajo.
        }
        return e.getStatusText();
    }
}
