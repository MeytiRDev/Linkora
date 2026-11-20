'use client'

import { Play, Pause, Mic } from 'lucide-react'
import { useRef, useState } from 'react'
import { clipTime } from './types'

export function VoicePlayer({ src, duration = 0 }: { src: string; duration?: number }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [length, setLength] = useState(duration)
  const [error, setError] = useState(false)
  const bars = [
    'h-2',
    'h-4',
    'h-3',
    'h-5',
    'h-7',
    'h-4',
    'h-6',
    'h-3',
    'h-5',
    'h-8',
    'h-6',
    'h-4',
    'h-7',
    'h-5',
    'h-3',
    'h-6',
    'h-8',
    'h-5',
    'h-4',
    'h-6',
    'h-3',
    'h-5',
    'h-7',
    'h-4',
    'h-6',
    'h-3',
    'h-5',
    'h-2',
    'h-4',
    'h-3',
    'h-5',
    'h-2',
  ]
  return (
    <div className="mt-3 w-full max-w-[360px] rounded-xl border border-[#b3f8bd]/10 bg-[#b3f8bd]/4 px-3.5 py-3">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onTimeUpdate={() => setTime(audio.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          if (Number.isFinite(audio.current?.duration)) setLength(audio.current!.duration)
        }}
        onEnded={() => setPlaying(false)}
        onError={() => {
          setPlaying(false)
          setError(true)
        }}
      />
      <div className="flex items-center gap-3">
        <button
          aria-label={playing ? 'Pause voice message' : 'Play voice message'}
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#b3f8bd] text-[#203026]"
          onClick={async () => {
            if (!audio.current) return
            if (playing) {
              audio.current.pause()
              setPlaying(false)
            } else {
              try {
                await audio.current.play()
                setPlaying(true)
                setError(false)
              } catch {
                setError(true)
              }
            }
          }}
        >
          {playing ? (
            <Pause size={15} fill="currentColor" />
          ) : (
            <Play size={15} fill="currentColor" className="ml-0.5" />
          )}
        </button>
        <div className="flex flex-1 items-center gap-[3px] overflow-hidden" aria-hidden="true">
          {bars.map((bar, index) => (
            <span
              key={index}
              className={`w-[3px] shrink-0 rounded-full ${bar} ${index / bars.length <= time / (length || 1) ? 'bg-[#b3f8bd]' : 'bg-[#627c68]'}`}
            />
          ))}
        </div>
        <span className="shrink-0 font-mono text-[10px] text-[#b6b9bf]">
          {clipTime(playing ? time : length)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-12 text-[9px] text-[#7d9483]">
        <Mic size={10} />
        {error ? 'Unable to play this clip. Try again.' : 'Voice message'}
      </div>
    </div>
  )
}
