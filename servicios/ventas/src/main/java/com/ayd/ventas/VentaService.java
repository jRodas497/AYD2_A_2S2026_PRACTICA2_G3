package com.ayd.ventas;

import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

@Service
public class VentaService {

    private static final int LIMITE_MAXIMO = 100;

    private final VentaRepository repositorio;
    private final LibrosClient libros;

    public VentaService(VentaRepository repositorio, LibrosClient libros) {
        this.repositorio = repositorio;
        this.libros = libros;
    }

    public Venta registrar(VentaRequest datos) {
        // Primero se descuenta: si no alcanzan las existencias, Libros rechaza y no se guarda nada.
        LibrosClient.Libro libro = libros.descontar(datos.libroId(), datos.cantidad());

        Venta venta = new Venta();
        venta.setLibroId(libro.id());
        venta.setTitulo(libro.titulo());
        venta.setAutor(libro.autor());
        venta.setCantidad(datos.cantidad());
        venta.setPrecioUnitario(libro.precio());
        venta.setFecha(Instant.now());
        try {
            return repositorio.save(venta);
        } catch (RuntimeException e) {
            // Sin esto el stock quedaría descontado por una venta que no existe.
            libros.devolver(datos.libroId(), datos.cantidad());
            throw e;
        }
    }

    public List<Venta> listar() {
        return repositorio.findAll(Sort.by(Sort.Direction.DESC, "fecha"));
    }

    public List<RankingItem> ranking(int limite) {
        int tope = Math.max(1, Math.min(limite, LIMITE_MAXIMO));
        return repositorio.ranking(PageRequest.of(0, tope));
    }
}
