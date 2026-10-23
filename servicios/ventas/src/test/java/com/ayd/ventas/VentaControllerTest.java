package com.ayd.ventas;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;

@WebMvcTest(VentaController.class)
class VentaControllerTest {

    @Autowired
    MockMvc mvc;

    @MockBean
    VentaService servicio;

    private static Venta venta() {
        Venta v = new Venta();
        v.setLibroId(1L);
        v.setTitulo("Cien años de soledad");
        v.setAutor("García Márquez");
        v.setCantidad(2);
        v.setPrecioUnitario(new BigDecimal("95.00"));
        v.setFecha(Instant.parse("2026-10-22T20:00:00Z"));
        return v;
    }

    @Test
    void registrarDevuelve201ConLaVenta() throws Exception {
        when(servicio.registrar(any(VentaRequest.class))).thenReturn(venta());

        mvc.perform(post("/api/ventas").contentType(MediaType.APPLICATION_JSON).content("{\"libroId\":1,\"cantidad\":2}"))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.cantidad").value(2))
                .andExpect(jsonPath("$.precioUnitario").value(95.00));
    }

    @Test
    void registrarRechazaCantidadCeroONegativaYLibroFaltante() throws Exception {
        String[] invalidos = {
            "{\"libroId\":1,\"cantidad\":0}",
            "{\"libroId\":1,\"cantidad\":-3}",
            "{\"cantidad\":2}",
            "{}",
        };
        for (String cuerpo : invalidos) {
            mvc.perform(post("/api/ventas").contentType(MediaType.APPLICATION_JSON).content(cuerpo))
                    .andExpect(status().isBadRequest());
        }
        verify(servicio, never()).registrar(any());
    }

    @Test
    void registrarPropagaElConflictoDeExistencias() throws Exception {
        when(servicio.registrar(any(VentaRequest.class)))
                .thenThrow(new ResponseStatusException(HttpStatus.CONFLICT, "Existencias insuficientes"));

        mvc.perform(post("/api/ventas").contentType(MediaType.APPLICATION_JSON).content("{\"libroId\":1,\"cantidad\":99}"))
                .andExpect(status().isConflict());
    }

    @Test
    void listarDevuelveLasVentas() throws Exception {
        when(servicio.listar()).thenReturn(List.of(venta()));

        mvc.perform(get("/api/ventas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].titulo").value("Cien años de soledad"));
    }

    @Test
    void rankingUsaDiezPorDefecto() throws Exception {
        when(servicio.ranking(10)).thenReturn(List.of(new RankingItem(1L, "Cien años de soledad", "García Márquez", 18)));

        mvc.perform(get("/api/ventas/ranking"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].libroId").value(1))
                .andExpect(jsonPath("$[0].totalVendido").value(18));
        verify(servicio).ranking(10);
    }

    @Test
    void rankingAceptaUnLimite() throws Exception {
        when(servicio.ranking(3)).thenReturn(List.of());

        mvc.perform(get("/api/ventas/ranking").param("limite", "3")).andExpect(status().isOk());
        verify(servicio).ranking(3);
    }
}
