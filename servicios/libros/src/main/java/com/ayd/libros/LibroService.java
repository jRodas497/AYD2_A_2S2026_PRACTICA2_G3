package com.ayd.libros;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LibroService {

    private final LibroRepository repositorio;

    public LibroService(LibroRepository repositorio) {
        this.repositorio = repositorio;
    }

    @Transactional(readOnly = true)
    public List<Libro> listar(String q) {
        if (q == null || q.isBlank()) {
            return repositorio.findAll(Sort.by("titulo"));
        }
        // Los comodines de LIKE se escapan: buscar "100%" no debe devolver todo el catálogo.
        String literal = q.trim().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return repositorio.buscar("%" + literal + "%");
    }

    @Transactional(readOnly = true)
    public Libro obtener(Long id) {
        return repositorio.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No existe el libro " + id));
    }

    @Transactional
    public Libro crear(LibroRequest datos) {
        return repositorio.save(aplicar(new Libro(), datos));
    }

    @Transactional
    public Libro actualizar(Long id, LibroRequest datos) {
        return repositorio.save(aplicar(obtener(id), datos));
    }

    @Transactional
    public Libro ajustarExistencias(Long id, int delta) {
        Libro libro = obtener(id);
        if (repositorio.ajustarExistencias(id, delta) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Existencias insuficientes: hay " + libro.getExistencias() + " y se pidió descontar " + -delta);
        }
        return obtener(id);
    }

    private Libro aplicar(Libro libro, LibroRequest datos) {
        libro.setTitulo(datos.titulo().trim());
        libro.setAutor(datos.autor().trim());
        libro.setPrecio(datos.precio());
        libro.setExistencias(datos.existencias());
        return libro;
    }
}
