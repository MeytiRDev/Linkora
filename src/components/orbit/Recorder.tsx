'use client'

import {
  Mic,
  Video,
  Circle,
  Square,
  RotateCcw,
  Send,
  Upload,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal, primaryClass } from './shared'
import { clipTime } from './types'

export function Recorder({
  kind,
  onClose,
  onSend,
}: {
  kind: 'voice' | 'video'
  onClose: () => void
  onSend: (file: File, duration: number) => Promise<void>
}) {
  const [status, setStatus] = useState<'ready' | 'recording' | 'preview' | 'sending'>('ready')
  const [seconds, setSeconds] = useState(0)
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)
  const video = useRef<HTMLVideoElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const objectURL = useRef('')
  const disposed = useRef(false)

  useEffect(() => {
    disposed.current = false
    return () => {
      disposed.current = true
      if (recorder.current?.state === 'recording') {
        recorder.current.onstop = null
        recorder.current.stop()
      }
      stream.current?.getTracks().forEach((track) => track.stop())
      if (objectURL.current) URL.revokeObjectURL(objectURL.current)
    }
  }, [])
  useEffect(() => {
    if (status !== 'recording') return
    const timer = setInterval(() => setSeconds((value) => value + 1), 1000)
    return () => clearInterval(timer)
  }, [status])
  useEffect(() => {
    if (seconds >= 180 && recorder.current?.state === 'recording') recorder.current.stop()
  }, [seconds])
  useEffect(() => {
    if (status === 'recording' && video.current) {
      video.current.srcObject = stream.current
      void video.current.play().catch(() => {})
    }
  }, [status])

  function preview(next: File) {
    if (objectURL.current) URL.revokeObjectURL(objectURL.current)
    objectURL.current = URL.createObjectURL(next)
    setUrl(objectURL.current)
    setFile(next)
    setStatus('preview')
  }
  async function start() {
    setError('')
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
        throw new Error(
          'Recording is not supported in this browser. You can upload a clip instead.',
        )
      const media = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: kind === 'video' ? { width: 1280, height: 720 } : false,
      })
      if (disposed.current) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = media
      const preferred =
        kind === 'video'
          ? ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4']
          : ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4']
      const mimeType = preferred.find((type) => MediaRecorder.isTypeSupported(type))
      const next = new MediaRecorder(media, mimeType ? { mimeType } : undefined)
      recorder.current = next
      const chunks: BlobPart[] = []
      next.ondataavailable = (event) => {
        if (event.data.size) chunks.push(event.data)
      }
      next.onerror = () => {
        setError('Recording stopped unexpectedly. Please try again.')
        media.getTracks().forEach((track) => track.stop())
        setStatus('ready')
      }
      next.onstop = () => {
        media.getTracks().forEach((track) => track.stop())
        if (disposed.current) return
        const type = next.mimeType.split(';')[0] || (kind === 'video' ? 'video/webm' : 'audio/webm')
        const extension = type.includes('mp4') ? 'mp4' : 'webm'
        const recorded = new File(chunks, `orbit-${kind}-${Date.now()}.${extension}`, { type })
        if (recorded.size > 20 * 1024 * 1024) {
          setError('This recording is larger than 20 MB. Please record a shorter clip.')
          setStatus('ready')
          return
        }
        preview(recorded)
      }
      setSeconds(0)
      setStatus('recording')
      next.start(250)
    } catch (error) {
      stream.current?.getTracks().forEach((track) => track.stop())
      setError(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Microphone or camera access was blocked. Allow access in your browser, or upload a clip below.'
          : error instanceof Error
            ? error.message
            : 'Recording could not start.',
      )
    }
  }
  async function send() {
    if (!file) return
    setStatus('sending')
    setError('')
    try {
      await onSend(file, seconds)
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not send the clip.')
      setStatus('preview')
    }
  }
  const KindIcon = kind === 'voice' ? Mic : Video
  return (
    <Modal
      title={`Send a ${kind} message`}
      onClose={status === 'sending' ? () => {} : onClose}
      wide={kind === 'video'}
    >
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#c0aff4]/10 text-[#c0aff4]">
        <KindIcon size={23} />
      </div>
      <h2 className="text-2xl font-semibold tracking-tight">A little more personal.</h2>
      <p className="mt-2 text-sm text-[#92939f]">
        Send a {kind === 'voice' ? 'voice note' : 'video message'} to the channel. Up to 3 minutes
        or 20 MB.
      </p>
      <div className="mt-6 flex min-h-40 flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-white/7 bg-[#121318] p-5">
        {kind === 'video' && status === 'recording' && (
          <video ref={video} autoPlay muted playsInline className="max-h-64 w-full rounded-lg" />
        )}
        {status === 'preview' || status === 'sending' ? (
          kind === 'video' ? (
            <video src={url} controls playsInline className="max-h-64 w-full rounded-lg" />
          ) : (
            <audio src={url} controls className="w-full" />
          )
        ) : (
          <>
            {!(kind === 'video' && status === 'recording') && (
              <KindIcon
                size={32}
                className={
                  status === 'recording' ? 'animate-pulse text-[#b3f8bd]' : 'text-[#656773]'
                }
              />
            )}
            <span className="font-mono text-2xl tracking-widest">{clipTime(seconds)}</span>
            <span className="text-xs text-[#767885]">
              {status === 'recording'
                ? 'Recording · make it a good one'
                : 'Your next great conversation starts here'}
            </span>
          </>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg bg-red-400/10 p-3 text-xs leading-5 text-red-300"
        >
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        {status === 'ready' && (
          <button onClick={() => void start()} className={`${primaryClass} flex-1`}>
            <Circle size={16} fill="currentColor" />
            Start recording
          </button>
        )}
        {status === 'recording' && (
          <button onClick={() => recorder.current?.stop()} className={`${primaryClass} flex-1`}>
            <Square size={14} fill="currentColor" />
            Stop recording
          </button>
        )}
        {(status === 'preview' || status === 'sending') && (
          <>
            <button
              disabled={status === 'sending'}
              onClick={() => {
                setFile(null)
                setSeconds(0)
                setStatus('ready')
              }}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 text-xs text-[#a1a2ad] hover:text-white"
            >
              <RotateCcw size={15} />
              Retake
            </button>
            <button
              disabled={status === 'sending'}
              onClick={() => void send()}
              className={`${primaryClass} flex-1`}
            >
              {status === 'sending' ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}{' '}
              {status === 'sending' ? 'Sending…' : 'Send message'}
            </button>
          </>
        )}
      </div>
      {status === 'ready' && (
        <button
          onClick={() => fileInput.current?.click()}
          className="mx-auto mt-4 flex items-center gap-2 text-xs text-[#92939f] hover:text-white"
        >
          <Upload size={14} />
          Upload an existing clip
        </button>
      )}
      <input
        ref={fileInput}
        type="file"
        accept={
          kind === 'voice'
            ? 'audio/webm,audio/ogg,audio/wav,audio/mpeg,audio/mp4'
            : 'video/webm,video/mp4,video/quicktime'
        }
        className="hidden"
        onChange={(event) => {
          const next = event.target.files?.[0]
          if (!next) return
          if (
            !next.type.startsWith(kind === 'voice' ? 'audio/' : 'video/') ||
            next.size > 20 * 1024 * 1024
          ) {
            setError('Select a matching audio or video clip under 20 MB.')
            return
          }
          setSeconds(0)
          setError('')
          preview(next)
        }}
      />
    </Modal>
  )
}
