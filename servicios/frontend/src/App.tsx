import { NavLink, Route, Routes } from 'react-router-dom'
import { LibroDetallePage } from './features/libros/pages/LibroDetallePage'
import { LibrosListPage } from './features/libros/pages/LibrosListPage'
import { RankingPage } from './features/ranking/pages/RankingPage'

// Pestaña con subrayado de 2px en la marca; el resto del marco es gris.
function pestana({ isActive }: { isActive: boolean }) {
  return `pulsable relative h-12 inline-flex items-center px-1 text-sm font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-brand after:origin-center after:transition-transform after:duration-200 after:ease-out-strong motion-reduce:after:transition-none ${
    isActive ? 'text-ink after:scale-x-100' : 'text-suave hover:text-ink after:scale-x-0'
  }`
}

function Marca() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2 5.5C5 4 8.5 4 12 6v13c-3.5-2-7-2-10-.5z" fill="#35858E" />
      <path d="M22 5.5C19 4 15.5 4 12 6v13c3.5-2 7-2 10-.5z" fill="#276169" />
    </svg>
  )
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header>
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-6" aria-label="Principal">
          <span className="inline-flex items-center gap-2 font-bold tracking-tight">
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
      {/* La hoja blanca: pegada al marco arriba, a 8px del borde en los demás lados; en teléfono ocupa toda la pantalla. */}
      <main className="flex-1 bg-white sm:mx-2 sm:mb-2 sm:rounded-2xl sm:border sm:border-borde">
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
