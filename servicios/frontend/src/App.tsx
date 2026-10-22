import { NavLink, Route, Routes } from 'react-router-dom'
import { LibroDetallePage } from './features/libros/pages/LibroDetallePage'
import { LibrosListPage } from './features/libros/pages/LibrosListPage'
import { RankingPage } from './features/ranking/pages/RankingPage'

function enlace({ isActive }: { isActive: boolean }) {
  return `text-sm px-3 py-1 rounded ${isActive ? 'bg-white text-brand-dark' : 'text-white hover:bg-brand-dark'}`
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="bg-brand">
        <nav className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-2">
          <span className="text-white font-semibold mr-4">Librería AYD</span>
          <NavLink to="/" end className={enlace}>
            Catálogo
          </NavLink>
          <NavLink to="/ranking" className={enlace}>
            Ranking
          </NavLink>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<LibrosListPage />} />
          <Route path="/libros/:id" element={<LibroDetallePage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="*" element={<p className="text-sm text-gray-500">Página no encontrada.</p>} />
        </Routes>
      </main>
    </div>
  )
}
