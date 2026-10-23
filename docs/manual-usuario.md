# Manual de usuario

Cómo consultar el catálogo de la Librería AYD, buscar libros, registrar una venta y ver los más vendidos. Solo hace falta un navegador; no hay que instalar nada ni iniciar sesión.

## Entrar a la página

Abre en el navegador la dirección que te dio el equipo. Es el nombre DNS del balanceador de carga, por ejemplo `http://<nombre-del-balanceador>`. La página abre en el catálogo.

En la barra superior hay dos opciones, **Catálogo** y **Ranking**. La que está activa aparece sobre un fondo oscuro.

## Ver el listado de libros

El catálogo muestra todos los libros en una lista y el total arriba a la derecha. En cada fila aparecen una portada con la inicial del título, el título, el autor, las existencias y el precio en quetzales.

![Catálogo de libros](capturas/01-catalogo.jpg)

Junto a las existencias hay un punto de color: verde si hay disponibles, naranja con **Quedan N** si quedan cinco o menos, y rojo con **Agotado** si no queda ninguno.

## Buscar por título o autor

Escribe en el cuadro **Buscar por título o autor**. La lista se filtra mientras escribes y no importan las mayúsculas ni los acentos: `garcia` encuentra a Gabriel García Márquez y `aleph` encuentra *El Aleph*.

![Búsqueda de libros por autor](capturas/02-busqueda.jpg)

Si ningún libro coincide, aparece un mensaje que lo indica. Para ver otra vez la lista completa, borra el texto del cuadro.

## Ver el detalle de un libro

Haz clic en una fila para abrir el detalle. Muestra la portada, el título, el autor, el precio y las existencias, y a la derecha el panel **Registrar venta**. Para regresar, usa **Volver al catálogo**.

![Detalle de un libro](capturas/03-detalle.jpg)

## Registrar una venta

En el panel **Registrar venta**, elige la cantidad con los botones **−** y **+**. No se puede pasar de las existencias. El **Total** cambia con la cantidad. Luego pulsa **Registrar venta**.

![Venta registrada](capturas/04-venta-registrada.jpg)

Si la venta se registra, aparece el mensaje **Venta registrada** con la cantidad y el precio, las existencias bajan y el enlace **Ver ranking** lleva a la lista de más vendidos.

Si mientras tanto alguien más compró y ya no hay suficientes ejemplares, la venta se rechaza y se muestra el motivo. Si el servicio de libros no responde, aparece un aviso; espera unos segundos y vuelve a intentarlo.

## Ver el ranking de más vendidos

La opción **Ranking** muestra los diez libros más vendidos, en orden, con el total de ejemplares vendidos de cada uno. Se calcula con todas las ventas registradas, así que cada venta nueva puede cambiar el orden. Si haces clic en un título, abre su detalle.

![Ranking de libros más vendidos](capturas/05-ranking.jpg)

Si todavía no hay ventas, aparece el mensaje **Todavía no hay ventas registradas**.
