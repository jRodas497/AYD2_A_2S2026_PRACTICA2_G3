import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  const base =
    'pulsable h-9 px-5 rounded-ctl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100'
  const styles =
    variant === 'primary'
      ? 'bg-brand-dark text-white hover:bg-brand-hondo'
      : 'bg-white text-ink border border-linea hover:bg-marco'
  return <button className={`${base} ${styles} ${className}`} {...rest} />
}
