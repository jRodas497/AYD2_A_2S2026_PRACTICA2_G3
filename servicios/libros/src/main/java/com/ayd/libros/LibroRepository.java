package com.ayd.libros;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LibroRepository extends JpaRepository<Libro, Long> {

    // unaccent para que "garcia" encuentre "García"; la extensión la crea db/schema.sql.
    @Query(value = """
            SELECT * FROM libro
            WHERE unaccent(titulo) ILIKE unaccent(:patron) OR unaccent(autor) ILIKE unaccent(:patron)
            ORDER BY titulo
            """, nativeQuery = true)
    List<Libro> buscar(@Param("patron") String patron);

    // Un solo UPDATE condicionado: dos ventas simultáneas no pueden dejar las existencias en negativo.
    @Modifying(clearAutomatically = true)
    @Query("UPDATE Libro l SET l.existencias = l.existencias + :delta WHERE l.id = :id AND l.existencias + :delta >= 0")
    int ajustarExistencias(@Param("id") Long id, @Param("delta") int delta);
}
