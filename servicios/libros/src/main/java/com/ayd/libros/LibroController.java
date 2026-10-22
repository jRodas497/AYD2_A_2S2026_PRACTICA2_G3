package com.ayd.libros;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/libros")
public class LibroController {

    private final LibroService servicio;

    public LibroController(LibroService servicio) {
        this.servicio = servicio;
    }

    @GetMapping
    public List<Libro> listar(@RequestParam(required = false) String q) {
        return servicio.listar(q);
    }

    @GetMapping("/{id}")
    public Libro obtener(@PathVariable Long id) {
        return servicio.obtener(id);
    }

    @PostMapping
    public ResponseEntity<Libro> crear(@Valid @RequestBody LibroRequest datos) {
        Libro creado = servicio.crear(datos);
        return ResponseEntity.created(URI.create("/api/libros/" + creado.getId())).body(creado);
    }

    @PutMapping("/{id}")
    public Libro actualizar(@PathVariable Long id, @Valid @RequestBody LibroRequest datos) {
        return servicio.actualizar(id, datos);
    }

    @PatchMapping("/{id}/existencias")
    public Libro ajustarExistencias(@PathVariable Long id, @Valid @RequestBody AjusteExistencias ajuste) {
        return servicio.ajustarExistencias(id, ajuste.delta());
    }
}
