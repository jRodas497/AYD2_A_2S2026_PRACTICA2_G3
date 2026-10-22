import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="pulsable inline-flex items-center gap-1 -ml-1 pr-2 py-1 mb-4 text-sm font-medium text-suave hover:text-ink"
    >
      <ChevronLeft size={16} aria-hidden="true" /> {label}
    </Link>
  )
}
