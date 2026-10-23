package com.ayd.ventas;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class VentaServiceTest {

    @Mock
    VentaRepository repositorio;

    @Mock
    LibrosClient libros;

    @InjectMocks
    VentaService servicio;

    private static final LibrosClient.Libro LIBRO =
            new LibrosClient.Libro(1L, "Cien años de soledad", "García Márquez", new BigDecimal("95.00"), 13);

    @Test
    void registrarDescuentaYGuardaUnaCopiaDeLosDatosDelLibro() {
        when(libros.descontar(1L, 2)).thenReturn(LIBRO);
        when(repositorio.save(any(Venta.class))).thenAnswer(i -> i.getArgument(0));

        Venta venta = servicio.registrar(new VentaRequest(1L, 2));

        assertThat(venta.getLibroId()).isEqualTo(1L);
        assertThat(venta.getTitulo()).isEqualTo("Cien años de soledad");
        assertThat(venta.getAutor()).isEqualTo("García Márquez");
        assertThat(venta.getCantidad()).isEqualTo(2);
        assertThat(venta.getPrecioUnitario()).isEqualByComparingTo("95.00");
        assertThat(venta.getFecha()).isNotNull();
    }

    @Test
    void siLibrosRechazaNoSeGuardaNada() {
        when(libros.descontar(1L, 50))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Existencias insuficientes"));

        assertThatThrownBy(() -> servicio.registrar(new VentaRequest(1L, 50)))
                .isInstanceOfSatisfying(ResponseStatusException.class,
                        e -> assertThat(e.getStatusCode()).isEqualTo(HttpStatus.CONFLICT));
        verify(repositorio, never()).save(any());
        verify(libros, never()).devolver(any(), anyInt());
    }

    @Test
    void siFallaGuardarSeDevuelveElStockYSeRelanzaElError() {
        when(libros.descontar(1L, 3)).thenReturn(LIBRO);
        when(repositorio.save(any(Venta.class))).thenThrow(new IllegalStateException("base caída"));

        assertThatThrownBy(() -> servicio.registrar(new VentaRequest(1L, 3)))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("base caída");
        verify(libros).devolver(1L, 3);
    }

    @Test
    void listarPideLasVentasMasRecientesPrimero() {
        List<Venta> ventas = List.of(new Venta());
        when(repositorio.findAll(ArgumentMatchers.<Sort>any()))
                .thenReturn(ventas);

        assertThat(servicio.listar()).isEqualTo(ventas);
        ArgumentCaptor<Sort> orden =
                ArgumentCaptor.forClass(Sort.class);
        verify(repositorio).findAll(orden.capture());
        assertThat(orden.getValue().getOrderFor("fecha").isDescending()).isTrue();
    }

    private int limiteUsado(int pedido) {
        servicio.ranking(pedido);
        ArgumentCaptor<Pageable> pagina = ArgumentCaptor.forClass(Pageable.class);
        verify(repositorio, atLeastOnce()).ranking(pagina.capture());
        Pageable ultima = pagina.getValue();
        assertThat(ultima).isEqualTo(PageRequest.of(0, ultima.getPageSize()));
        return ultima.getPageSize();
    }

    @Test
    void rankingRespetaElLimitePedido() {
        assertThat(limiteUsado(10)).isEqualTo(10);
    }

    @Test
    void rankingSubeElLimiteAUnoSiPidenCeroONegativo() {
        assertThat(limiteUsado(0)).isEqualTo(1);
    }

    @Test
    void rankingTopaElLimiteEnCien() {
        assertThat(limiteUsado(5000)).isEqualTo(100);
    }
}
