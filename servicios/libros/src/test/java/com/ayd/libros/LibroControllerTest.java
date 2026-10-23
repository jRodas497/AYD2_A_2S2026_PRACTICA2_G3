package com.ayd.libros;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(LibroController.class)
class LibroControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    LibroService servicio;

    private static Libro libro(String titulo) {
        Libro l = new Libro();
        l.setTitulo(titulo);
        l.setAutor("Autor");
        l.setPrecio(new BigDecimal("95.00"));
        l.setExistencias(15);
        return l;
    }

    private static final String VALIDO = """
            {"titulo":"Ficciones","autor":"Borges","precio":72.25,"existencias":3}""";

    @Test
    void listarDevuelveLosLibrosYPasaLaBusqueda() throws Exception {
        when(servicio.listar("garcia")).thenReturn(List.of(libro("Cien años de soledad")));

        mvc.perform(get("/api/libros").param("q", "garcia"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo").value("Cien años de soledad"))
                .andExpect(jsonPath("$[0].existencias").value(15));
    }

    @Test
    void obtenerLibroInexistenteDevuelve404() throws Exception {
        when(servicio.obtener(9L)).thenThrow(new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el libro 9"));

        mvc.perform(get("/api/libros/9")).andExpect(status().isNotFound());
    }

    @Test
    void crearDevuelve201ConLocation() throws Exception {
        Libro creado = libro("Ficciones");
        when(servicio.crear(any(LibroRequest.class))).thenReturn(creado);

        mvc.perform(post("/api/libros").contentType(MediaType.APPLICATION_JSON).content(VALIDO))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/libros/null"))
                .andExpect(jsonPath("$.titulo").value("Ficciones"));
    }

    @Test
    void crearRechazaDatosInvalidosConBadRequest() throws Exception {
        String[] invalidos = {
            """
            {"titulo":"","autor":"Borges","precio":10,"existencias":1}""",
            """
            {"titulo":"Ficciones","autor":"  ","precio":10,"existencias":1}""",
            """
            {"titulo":"Ficciones","autor":"Borges","precio":-1,"existencias":1}""",
            """
            {"titulo":"Ficciones","autor":"Borges","precio":10,"existencias":-5}""",
            """
            {"titulo":"Ficciones","autor":"Borges","existencias":1}""",
        };
        for (String cuerpo : invalidos) {
            mvc.perform(post("/api/libros").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isBadRequest());
        }
        verify(servicio, never()).crear(any());
    }

    @Test
    void crearRechazaUnTituloMasLargoQueElLimite() throws Exception {
        String cuerpo = "{\"titulo\":\"" + "x".repeat(201) + "\",\"autor\":\"A\",\"precio\":1,\"existencias\":1}";

        mvc.perform(post("/api/libros").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                .andExpect(status().isBadRequest());
    }

    @Test
    void actualizarValidaYDelegaEnElServicio() throws Exception {
        when(servicio.actualizar(eq(1L), any(LibroRequest.class))).thenReturn(libro("Ficciones"));

        mvc.perform(put("/api/libros/1").contentType(MediaType.APPLICATION_JSON).content(VALIDO))
                .andExpect(status().isOk());
        mvc.perform(put("/api/libros/1").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ajustarExistenciasPasaElDelta() throws Exception {
        when(servicio.ajustarExistencias(1L, -2)).thenReturn(libro("A"));

        mvc.perform(patch("/api/libros/1/existencias").contentType(MediaType.APPLICATION_JSON).content("{\"delta\":-2}"))
                .andExpect(status().isOk());
        verify(servicio).ajustarExistencias(1L, -2);
    }

    @Test
    void ajustarExistenciasSinDeltaEsBadRequest() throws Exception {
        mvc.perform(patch("/api/libros/1/existencias").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void ajustarExistenciasConConflictoDevuelve409() throws Exception {
        when(servicio.ajustarExistencias(1L, -9))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Existencias insuficientes"));

        mvc.perform(patch("/api/libros/1/existencias").contentType(MediaType.APPLICATION_JSON).content("{\"delta\":-9}"))
                .andExpect(status().isConflict());
    }
}
