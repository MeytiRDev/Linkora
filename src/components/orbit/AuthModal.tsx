'use client'

import { ArrowRight, Eye, EyeOff, Loader2, Orbit, ShieldCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Modal, inputClass, primaryClass } from './shared'
import { postJSON } from './types'

export function AuthModal({
  onClose,
  onSuccess,
  initialMode = 'signup',
}: {
  onClose: () => void
  onSuccess: () => Promise<void>
  initialMode?: 'signup' | 'login'
}) {
  const [mode, setMode] = useState(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const values = Object.fromEntries(new FormData(event.currentTarget))
    try {
      await postJSON('/api/session', { ...values, action: mode })
      await onSuccess()
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      title={mode === 'signup' ? 'Create an Orbit account' : 'Sign in to Orbit'}
      onClose={onClose}
    >
      <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-[#b3f8bd]/10 text-[#b3f8bd]">
        <Orbit size={29} strokeWidth={1.5} />
      </div>
      <p className="mb-2 text-[10px] font-semibold tracking-[.2em] text-[#b3f8bd]">
        YOUR PEOPLE. YOUR SPACE.
      </p>
      <h2 className="text-[29px] font-semibold tracking-tight">
        {mode === 'signup' ? 'Find your people.' : 'Welcome back.'}
      </h2>
      <p className="mt-2 text-sm leading-6 text-[#9596a3]">
        {mode === 'signup'
          ? 'A place for good conversations and great ideas. Make yourself at home.'
          : 'Your corner of the internet is waiting for you.'}
      </p>
      <div className="mt-6 mb-6 flex rounded-lg bg-[#111216] p-1">
        {(['signup', 'login'] as const).map((item) => (
          <button
            key={item}
            onClick={() => {
              setMode(item)
              setError('')
            }}
            className={`flex-1 rounded-md py-2 text-xs font-medium ${mode === item ? 'bg-[#2b2d34] text-white shadow' : 'text-[#858692] hover:text-white'}`}
          >
            {item === 'signup' ? 'Create an account' : 'Sign in'}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && (
          <label className="block space-y-2 text-xs font-medium text-[#d0d0d8]">
            <span>Display name</span>
            <input
              name="displayName"
              required
              minLength={2}
              maxLength={32}
              autoComplete="nickname"
              placeholder="What should we call you?"
              className={inputClass}
            />
          </label>
        )}
        <label className="block space-y-2 text-xs font-medium text-[#d0d0d8]">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            placeholder="you@example.com"
            className={inputClass}
          />
        </label>
        <label className="block space-y-2 text-xs font-medium text-[#d0d0d8]">
          <span>Password</span>
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              maxLength={128}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder="At least 8 characters"
              className={`${inputClass} pr-12`}
            />
            <button
              type="button"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute top-3.5 right-3 text-[#858692]"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-400/10 p-3 text-xs leading-5 text-red-300">
            {error}
          </p>
        )}
        <button disabled={busy} className={`${primaryClass} mt-2 w-full`}>
          {busy ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
      <div className="mt-5 flex items-center justify-center gap-2 text-[10px] text-[#737581]">
        <ShieldCheck size={13} />
        Your email stays private. Always.
      </div>
    </Modal>
  )
}
