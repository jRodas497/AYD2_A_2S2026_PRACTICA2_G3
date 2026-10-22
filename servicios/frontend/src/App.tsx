import { NavLink, Route, Routes } from 'react-router-dom'
import { LibroDetallePage } from './features/libros/pages/LibroDetallePage'
import { LibrosListPage } from './features/libros/pages/LibrosListPage'
import { RankingPage } from './features/ranking/pages/RankingPage'

// Pestañas en píldora: la activa va en tinta oscura.
function pestana({ isActive }: { isActive: boolean }) {
return `pulsable h-9 inline-flex items-center px-4 rounded-full text-sm font-semibold ${
    isActive ? 'bg-ink text-white' : 'text-suave hover:text-ink hover:bg-marco'
  }`
}

function Marca() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 5.5C5 4 8.5 4 12 6v13c-3.5-2-7-2-10-.5z" className="fill-brand" />
      <path d="M22 5.5C19 4 15.5 4 12 6v13c3.5-2 7-2 10-.5z" className="fill-brand-dark" />
    </svg>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3" aria-label="Principal">
          <span className="inline-flex items-center gap-2 mr-3 font-bold tracking-tight">
            <Marca /> Librería AYD
          </span>
          <NavLink to="/" end className={pestana}>
            Catálogo
          </NavLink>
          <NavLink to="/ranking" className={pestana}>
            Ranking
          </NavLink>
        </nav>
      </header>
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <Routes>
            <Route path="/" element={<LibrosListPage />} />
            <Route path="/libros/:id" element={<LibroDetallePage />} />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="*" element={<p className="text-sm text-suave">Página no encontrada.</p>} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
