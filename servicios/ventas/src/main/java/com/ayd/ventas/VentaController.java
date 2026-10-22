package com.ayd.ventas;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ventas")
public class VentaController {

    private final VentaService servicio;

    public VentaController(VentaService servicio) {
        this.servicio = servicio;
    }

    @PostMapping
    public ResponseEntity<Venta> registrar(@Valid @RequestBody VentaRequest datos) {
        Venta creada = servicio.registrar(datos);
        return ResponseEntity.created(URI.create("/api/ventas/" + creada.getId())).body(creada);
    }

    @GetMapping
    public List<Venta> listar() {
        return servicio.listar();
    }

    @GetMapping("/ranking")
    public List<RankingItem> ranking(@RequestParam(defaultValue = "10") int limite) {
        return servicio.ranking(limite);
    }
}
