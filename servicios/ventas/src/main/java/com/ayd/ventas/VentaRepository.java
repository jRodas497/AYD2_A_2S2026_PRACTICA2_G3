package com.ayd.ventas;

import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface VentaRepository extends JpaRepository<Venta, Long> {

    @Query("""
            SELECT new com.ayd.ventas.RankingItem(v.libroId, MAX(v.titulo), MAX(v.autor), SUM(v.cantidad))
            FROM Venta v
            GROUP BY v.libroId
            ORDER BY SUM(v.cantidad) DESC, MAX(v.titulo)
            """)
    List<RankingItem> ranking(Pageable limite);
}
