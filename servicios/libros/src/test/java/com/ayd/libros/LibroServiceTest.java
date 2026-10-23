package com.ayd.libros;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class LibroServiceTest {

    @Mock
    LibroRepository repositorio;

    @InjectMocks
    LibroService servicio;

    private static Libro libro(String titulo, int existencias) {
        Libro l = new Libro();
        l.setTitulo(titulo);
        l.setAutor("Autor");
        l.setPrecio(new BigDecimal("10.00"));
        l.setExistencias(existencias);
        return l;
    }

    @Test
    void listarSinBusquedaDevuelveTodoOrdenadoPorTitulo() {
        List<Libro> todos = List.of(libro("A", 1), libro("B", 2));
        when(repositorio.findAll(Sort.by("titulo"))).thenReturn(todos);

        assertThat(servicio.listar(null)).isEqualTo(todos);
        assertThat(servicio.listar("   ")).isEqualTo(todos);
        verify(repositorio, never()).buscar(any());
    }

    @Test
    void listarBuscaPorPatronConLaConsultaRecortada() {
        servicio.listar("  garcia ");

        verify(repositorio).buscar("%garcia%");
    }

    @Test
    void listarEscapaLosComodinesDeLike() {
        servicio.listar("100%_a\\b");

        ArgumentCaptor<String> patron = ArgumentCaptor.forClass(String.class);
        verify(repositorio).buscar(patron.capture());
        assertThat(patron.getValue()).isEqualTo("%100\\%\\_a\\\\b%");
    }

    @Test
    void obtenerLanzaNotFoundSiNoExiste() {
        when(repositorio.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.obtener(99L))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
                    assertThat(e.getReason()).contains("99");
                });
    }

    @Test
    void crearRecortaTituloYAutor() {
        when(repositorio.save(any(Libro.class))).thenAnswer(i -> i.getArgument(0));

        Libro creado = servicio.crear(new LibroRequest("  Ficciones ", " Borges  ", new BigDecimal("72.25"), 3));

        assertThat(creado.getTitulo()).isEqualTo("Ficciones");
        assertThat(creado.getAutor()).isEqualTo("Borges");
        assertThat(creado.getPrecio()).isEqualByComparingTo("72.25");
        assertThat(creado.getExistencias()).isEqualTo(3);
    }

    @Test
    void actualizarCambiaLosCamposDelLibroExistente() {
        Libro existente = libro("Viejo", 1);
        when(repositorio.findById(1L)).thenReturn(Optional.of(existente));
        when(repositorio.save(existente)).thenReturn(existente);

        Libro actualizado = servicio.actualizar(1L, new LibroRequest("Nuevo", "Otro", new BigDecimal("5.50"), 9));

        assertThat(actualizado.getTitulo()).isEqualTo("Nuevo");
        assertThat(actualizado.getExistencias()).isEqualTo(9);
    }

    @Test
    void ajustarExistenciasDevuelveElLibroActualizado() {
        Libro libro = libro("A", 5);
        when(repositorio.findById(1L)).thenReturn(Optional.of(libro));
        when(repositorio.ajustarExistencias(1L, -2)).thenReturn(1);

        assertThat(servicio.ajustarExistencias(1L, -2)).isSameAs(libro);
    }

    @Test
    void ajustarExistenciasRechazaConConflictoSiNoAlcanzan() {
        when(repositorio.findById(1L)).thenReturn(Optional.of(libro("A", 1)));
        when(repositorio.ajustarExistencias(1L, -3)).thenReturn(0);

        assertThatThrownBy(() -> servicio.ajustarExistencias(1L, -3))
                .isInstanceOfSatisfying(ResponseStatusException.class, e -> {
                    assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
                    assertThat(e.getReason()).contains("hay 1").contains("descontar 3");
                });
    }

    @Test
    void ajustarExistenciasDeLibroInexistenteNoTocaLaBase() {
        when(repositorio.findById(7L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> servicio.ajustarExistencias(7L, -1))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND));
        verify(repositorio, never()).ajustarExistencias(anyLong(), anyInt());
        verify(repositorio, never()).save(any());
    }
}
