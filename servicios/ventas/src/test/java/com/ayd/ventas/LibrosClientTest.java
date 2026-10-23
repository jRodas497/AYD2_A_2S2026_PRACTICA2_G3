package com.ayd.ventas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Se prueba contra un servidor HTTP real y mínimo que hace de Libros, sin depender de la red ni de otro servicio. */
class LibrosClientTest {

    private HttpServer servidor;
    private LibrosClient cliente;
    private final AtomicReference<String> metodo = new AtomicReference<>();
    private final AtomicReference<String> ruta = new AtomicReference<>();
    private final AtomicReference<String> cuerpoRecibido = new AtomicReference<>();

    @BeforeEach
    void levantarServidor() throws IOException {
        servidor = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        servidor.start();
        cliente = new LibrosClient("http://127.0.0.1:" + servidor.getAddress().getPort());
    }

    @AfterEach
    void detenerServidor() {
        servidor.stop(0);
    }

    private void responder(int codigo, String json) {
        servidor.createContext("/", intercambio -> {
            metodo.set(intercambio.getRequestMethod());
            ruta.set(intercambio.getRequestURI().getPath());
            cuerpoRecibido.set(new String(intercambio.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
            intercambio.getResponseHeaders().add("Content-Type", "application/json");
            intercambio.sendResponseHeaders(codigo, bytes.length == 0 ? -1 : bytes.length);
            if (bytes.length > 0) {
                intercambio.getResponseBody().write(bytes);
            }
            intercambio.close();
        });
    }

    @Test
    void descontarEnviaUnPatchConDeltaNegativoYLeeElLibro() {
        responder(200, "{\"id\":4,\"titulo\":\"Pedro Páramo\",\"autor\":\"Rulfo\",\"precio\":60.00,\"existencias\":5}");

        LibrosClient.Libro libro = cliente.descontar(4L, 2);

        assertThat(metodo.get()).isEqualTo("PATCH");
        assertThat(ruta.get()).isEqualTo("/api/libros/4/existencias");
        assertThat(cuerpoRecibido.get()).contains("\"delta\":-2");
        assertThat(libro.titulo()).isEqualTo("Pedro Páramo");
        assertThat(libro.precio()).isEqualByComparingTo("60.00");
        assertThat(libro.existencias()).isEqualTo(5);
    }

    @Test
    void devolverEnviaDeltaPositivo() {
        responder(200, "{\"id\":4,\"titulo\":\"t\",\"autor\":\"a\",\"precio\":1,\"existencias\":7}");

        cliente.devolver(4L, 2);

        assertThat(cuerpoRecibido.get()).contains("\"delta\":2");
    }

    @Test
    void propagaElConflictoDeLibrosConSuMensaje() {
        responder(409, "{\"message\":\"Existencias insuficientes: hay 1 y se pidió descontar 5\"}");

        assertThatThrownBy(() -> cliente.descontar(4L, 5))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).contains("hay 1");
                });
    }

    @Test
    void propagaElNotFoundDeLibros() {
        responder(404, "{\"message\":\"No existe el libro 99\"}");

        assertThatThrownBy(() -> cliente.descontar(99L, 1))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(e.getReason()).isEqualTo("No existe el libro 99");
                });
    }

    @Test
    void usaElTextoDelEstadoSiElCuerpoNoTraeMensaje() {
        responder(409, "");

        assertThatThrownBy(() -> cliente.descontar(4L, 5))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
    }

    @Test
    void otroCodigoDeLibrosEsUnBadGateway() {
        responder(500, "{\"message\":\"boom\"}");

        assertThatThrownBy(() -> cliente.descontar(4L, 1))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
                    assertThat(e.getReason()).contains("500");
                });
    }

    @Test
    void siLibrosNoRespondeEsUnServiceUnavailable() {
        servidor.stop(0);

        assertThatThrownBy(() -> cliente.descontar(4L, 1))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
    }
}
