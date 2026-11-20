'use client'

import { X, Orbit, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import { avatarColors, type Member } from './types'

export function Avatar({
  member,
  size = 'md',
  active = false,
}: {
  member?: Member | null
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-[14px] bg-linear-to-br font-semibold shadow-inner ${avatarColors[member?.color || 'violet']} ${size === 'sm' ? 'size-8 rounded-[11px] text-[11px]' : size === 'lg' ? 'size-16 rounded-[22px] text-xl' : 'size-10 text-[13px]'}`}
    >
      {member?.displayName
        ?.split(' ')
        .map((part) => part[0])
        .slice(0, 2)
        .join('') || <Orbit size={20} />}
      {active && (
        <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-[3px] border-[#1a1b20] bg-[#a3f5b9]" />
      )}
    </span>
  )
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
  className = '',
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onClick?: () => void
  active?: boolean
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-white/6 hover:text-white disabled:cursor-not-allowed disabled:opacity-30 ${active ? 'bg-[#b3f8bd]/10 text-[#b3f8bd]' : 'text-[#92939e]'} ${className}`}
    >
      <Icon size={18} strokeWidth={1.7} />
    </button>
  )
}

export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => {
    close.current = onClose
  }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const frame = requestAnimationFrame(() =>
      ref.current?.querySelector<HTMLElement>('input, button, textarea')?.focus(),
    )
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') close.current()
      if (event.key !== 'Tab') return
      const items = ref.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, textarea, select, a[href], [tabindex="0"]',
      )
      if (!items?.length) return
      const first = items[0],
        last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', key)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', key)
      previous?.focus()
    }
  }, [])
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-5 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative max-h-[90dvh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#1a1c21] p-7 shadow-2xl ${wide ? 'max-w-xl' : 'max-w-[430px]'}`}
      >
        <IconButton
          icon={X}
          label="Close dialog"
          onClick={onClose}
          className="absolute top-4 right-4"
        />
        {children}
      </div>
    </div>
  )
}

export const inputClass =
  'w-full rounded-lg border border-white/10 bg-[#121318] px-3.5 py-3 text-sm text-white outline-none transition focus:border-[#b3f8bd]/60 focus:ring-2 focus:ring-[#b3f8bd]/10 placeholder:text-[#62636e]'
export const primaryClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#b3f8bd] px-5 py-3 text-sm font-semibold text-[#18251c] transition hover:bg-[#caffd1] disabled:cursor-wait disabled:opacity-50'
