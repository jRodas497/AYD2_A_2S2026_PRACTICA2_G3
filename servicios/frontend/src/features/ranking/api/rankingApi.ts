import { manejarRespuesta } from '../../../shared/api/httpErrors'

export interface RankingItem {
  libroId: number
  titulo: string
  autor: string
  totalVendido: number
}

export async function obtenerRanking(limite = 10): Promise<RankingItem[]> {
  return manejarRespuesta<RankingItem[]>(await fetch(`/api/ventas/ranking?limite=${limite}`))
}
