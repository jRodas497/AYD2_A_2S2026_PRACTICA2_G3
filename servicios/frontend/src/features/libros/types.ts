export interface Libro {
  id: number
  titulo: string
  autor: string
  precio: number
  existencias: number
}

export interface Venta {
  id: number
  libroId: number
  titulo: string
  autor: string
  cantidad: number
  precioUnitario: number
  fecha: string
}
