# Manual de usuario

Guía para consultar el catálogo de la Librería AYD, buscar libros, registrar una venta y ver cuáles son los más vendidos. No hace falta instalar nada ni iniciar sesión: basta un navegador.

## Entrar a la página

Abre en el navegador la dirección que te entregó el equipo, que es el nombre DNS del balanceador de carga (por ejemplo `http://<nombre-del-balanceador>`). Se abre el catálogo.

La barra verde de arriba tiene dos opciones: **Catálogo** y **Ranking**. La opción activa aparece resaltada en blanco.

## Ver el listado de libros

El catálogo muestra todos los libros en tarjetas. Cada tarjeta indica el título, el autor, el precio en quetzales y cuántos ejemplares hay disponibles.

![Catálogo de libros](capturas/01-catalogo.jpg)

Si un libro se agota, la tarjeta muestra **Agotado** en rojo en lugar de las existencias.

## Buscar por título o autor

Escribe en el cuadro **Buscar por título o autor** y la lista se filtra mientras escribes. La búsqueda no distingue mayúsculas ni acentos: `garcia` encuentra a Gabriel García Márquez y `aleph` encuentra *El Aleph*.

![Búsqueda de libros por autor](capturas/02-busqueda.jpg)

Si no hay coincidencias, aparece el mensaje **No se encontraron libros**. Para volver a ver todo, borra el texto del cuadro.

## Ver el detalle de un libro

Haz clic en una tarjeta para abrir el detalle: título, autor, precio y existencias. Para regresar usa **Volver al catálogo**.

![Detalle de un libro](capturas/03-detalle.jpg)

## Registrar una venta

En el detalle, elige la cantidad con los botones **−** y **+** (no puede superar las existencias) y pulsa **Registrar venta**.

![Venta registrada](capturas/04-venta-registrada.jpg)

Aparece el mensaje **Venta registrada** con la cantidad y el precio, las existencias bajan y el enlace **Ver ranking** te lleva a la lista de más vendidos.

Si pides más ejemplares de los que hay, la venta se rechaza y se muestra el motivo. Si el servicio de libros no responde, aparece un aviso y puedes intentar de nuevo en unos segundos.

## Ver el ranking de más vendidos

La opción **Ranking** muestra los diez libros más vendidos, del primero al décimo, con el total de ejemplares vendidos. Se calcula con todas las ventas registradas, así que cada venta nueva puede cambiar el orden. Al hacer clic en un título vas a su detalle.

![Ranking de libros más vendidos](capturas/05-ranking.jpg)

Si todavía no hay ventas, aparece **Todavía no hay ventas registradas**.
