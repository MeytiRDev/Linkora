'use client'

import {
  Orbit,
  Plus,
  Compass,
  Hash,
  ChevronDown,
  ChevronRight,
  Megaphone,
  BookOpen,
  Mic,
  Video,
  Settings2,
  Search,
  Pin,
  Users,
  Info,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  X,
  Send,
  SmilePlus,
  Heart,
  Flame,
  ThumbsUp,
  Check,
  ShieldCheck,
  Copy,
  CheckCheck,
  LogOut,
  Loader2,
  Menu,
  PanelLeftClose,
  MessageCircle,
  AudioLines,
  Globe2,
  Command,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import type { Channel, Message } from '@/payload-types'
import { AuthModal } from './AuthModal'
import { Recorder } from './Recorder'
import { VoicePlayer } from './VoicePlayer'
import { Avatar, IconButton, Modal, inputClass, primaryClass } from './shared'
import { avatarColors, postJSON, type Community, type Member } from './types'

const emptyCommunity: Community = {
  channels: [],
  selected: null,
  messages: [],
  reactions: [],
  members: [],
  user: null,
}
const reactionIcons = { heart: Heart, fire: Flame, sparkles: Sparkles, like: ThumbsUp }
type Dialog = 'about' | 'browse' | 'channel' | 'invite' | 'profile' | 'help' | null

function OrbitArt({ small = false }: { small?: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute overflow-hidden ${small ? 'inset-0 opacity-80' : 'inset-y-0 right-0 w-[48%] opacity-80'}`}
      aria-hidden="true"
    >
      <div
        className={`absolute rounded-full bg-[#a4e8b7]/10 blur-[35px] ${small ? '-top-14 right-2 size-40' : '-top-8 right-14 size-48'}`}
      />
      <svg
        viewBox="0 0 300 220"
        className={`absolute h-full w-full ${small ? 'translate-x-14 scale-150' : 'translate-x-3 scale-125'}`}
        fill="none"
      >
        <defs>
          <linearGradient
            id={small ? 'orbit-small' : 'orbit-large'}
            x1="60"
            y1="20"
            x2="240"
            y2="200"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#c5ffd0" />
            <stop offset="1" stopColor="#557763" stopOpacity=".05" />
          </linearGradient>
        </defs>
        <g
          stroke={`url(#${small ? 'orbit-small' : 'orbit-large'})`}
          strokeWidth=".65"
          transform="rotate(-26 155 110)"
        >
          <ellipse cx="155" cy="110" rx="80" ry="80" />
          {[19, 39, 58, 73].map((radius) => (
            <ellipse key={radius} cx="155" cy="110" rx={radius} ry="80" />
          ))}
          {[35, 58, 74].map((radius) => (
            <ellipse key={radius} cx="155" cy="110" rx="80" ry={radius} />
          ))}
          <path d="M75 110h160M155 30v160" />
          <ellipse
            cx="155"
            cy="110"
            rx="126"
            ry="29"
            transform="rotate(-12 155 110)"
            strokeWidth="1.3"
          />
          <circle cx="266" cy="71" r="4" fill="#c4ffce" stroke="none" />
        </g>
        <path
          d="M48 45v8m-4-4h8M242 160v10m-5-5h10M49 161v4m-2-2h4"
          stroke="#a9d2b1"
          strokeWidth="1"
        />
        <circle cx="240" cy="36" r="1.5" fill="#a9d2b1" />
      </svg>
    </div>
  )
}

export function OrbitApp() {
  const [data, setData] = useState<Community>(emptyCommunity)
  const [channelId, setChannelId] = useState<Channel['id'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice, setNotice] = useState('')
  const [auth, setAuth] = useState<'signup' | 'login' | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [recording, setRecording] = useState<'voice' | 'video' | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [showMembers, setShowMembers] = useState(true)
  const [mobileNav, setMobileNav] = useState(false)
  const [search, setSearch] = useState('')
  const [pinned, setPinned] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [attachments, setAttachments] = useState(false)
  const [reactionPicker, setReactionPicker] = useState<Message['id'] | null>(null)
  const [quickReplies, setQuickReplies] = useState(false)
  const [collapsed, setCollapsed] = useState<string[]>([])
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [browseSearch, setBrowseSearch] = useState('')
  const [profileColor, setProfileColor] = useState('mint')
  const scroll = useRef<HTMLDivElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)
  const searchInput = useRef<HTMLInputElement>(null)
  const latestRequest = useRef(0)
  const activeId = useRef<Channel['id'] | null>(null)
  const shouldScroll = useRef(false)
  const lastChannel = useRef<Channel['id'] | null>(null)

  const refresh = useCallback(
    async (initial = false) => {
      const requestId = ++latestRequest.current
      try {
        const response = await fetch(
          `/api/community${channelId ? `?channel=${encodeURIComponent(channelId)}` : ''}`,
          { cache: 'no-store' },
        )
        const next = await response.json()
        if (!response.ok) throw new Error(next.error || 'Unable to load the community.')
        if (requestId !== latestRequest.current) return
        if (shouldScroll.current) {
          requestAnimationFrame(() => {
            if (scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight
          })
          shouldScroll.current = false
        } else if (lastChannel.current !== next.selected) {
          requestAnimationFrame(() => {
            if (scroll.current) scroll.current.scrollTop = 0
          })
        }
        lastChannel.current = next.selected
        activeId.current = next.selected
        setData(next)
        setLoadError('')
      } catch (error) {
        if (initial)
          setLoadError(
            error instanceof Error ? error.message : 'Unable to connect. Please try again.',
          )
      } finally {
        if (requestId === latestRequest.current) setLoading(false)
      }
    },
    [channelId],
  )

  useEffect(() => {
    setLoading(true)
    void refresh(true)
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, 5000)
    return () => {
      clearInterval(timer)
      latestRequest.current += 1
    }
  }, [refresh])
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(''), 4500)
    return () => clearTimeout(timer)
  }, [notice])
  useEffect(() => {
    if (!data.user) return
    const timer = setInterval(
      () => {
        void postJSON('/api/session', { action: 'refresh' }).catch(() => void refresh())
      },
      30 * 60 * 1000,
    )
    return () => clearInterval(timer)
  }, [data.user?.id, refresh])
  useEffect(() => {
    function key(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        searchInput.current?.focus()
      }
      if (event.key === 'Escape') {
        setReactionPicker(null)
        setAttachments(false)
        setQuickReplies(false)
        setMobileNav(false)
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])
  const channel = data.channels.find((item) => item.id === data.selected)
  const currentMessages = data.messages.filter(
    (message) =>
      (!pinned || message.pinned) &&
      (!search ||
        message.body?.toLowerCase().includes(search.toLowerCase()) ||
        (typeof message.author === 'object' &&
          message.author.displayName.toLowerCase().includes(search.toLowerCase()))),
  )

  function chooseChannel(next: Channel) {
    setChannelId(next.id)
    activeId.current = next.id
    setSearch('')
    setPinned(false)
    setMobileNav(false)
    setDraft('')
  }
  function requireAccount(action: () => void) {
    if (!data.user) setAuth('signup')
    else action()
  }
  function openRecording(kind: 'voice' | 'video') {
    requireAccount(() => {
      setRecording(kind)
      setAttachments(false)
    })
  }
  async function mutate(payload: unknown) {
    try {
      const result = await postJSON('/api/community', payload)
      await refresh()
      return result
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Please try again.')
      throw error
    }
  }
  async function sendMessage() {
    if (!draft.trim() || sending) return
    if (!data.user) {
      setAuth('signup')
      return
    }
    if (!data.selected) return
    setSending(true)
    try {
      shouldScroll.current = true
      await mutate({ action: 'message', channel: data.selected, kind: 'text', body: draft })
      setDraft('')
      composer.current?.focus()
    } catch {
      /* The mutation displays a helpful error without losing the draft. */
    } finally {
      setSending(false)
    }
  }
  async function sendClip(file: File, duration: number) {
    const selected = activeId.current
    const form = new FormData()
    form.append('file', file)
    const response = await fetch('/api/clips', { method: 'POST', body: form })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Upload failed.')
    shouldScroll.current = true
    await mutate({
      action: 'message',
      channel: selected,
      kind: file.type.startsWith('video') ? 'video' : 'voice',
      body: '',
      attachment: result.id,
      duration,
    })
  }
  async function react(message: Message['id'], kind: string) {
    setReactionPicker(null)
    if (!data.user) {
      setAuth('signup')
      return
    }
    try {
      await mutate({ action: 'reaction', message, kind })
    } catch {
      /* Error shown in the toast. */
    }
  }
  function openDialog(next: Dialog) {
    setDialog(next)
    setFormError('')
    setBusy(false)
    setProfileColor(data.user?.color || 'mint')
  }
  async function submitChannel(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget))
      const result = await postJSON('/api/community', { ...values, action: 'channel' })
      setChannelId(result.id)
      setDialog(null)
      setNotice('Your new channel is ready. Make it a good one.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setFormError('')
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget))
      await postJSON('/api/community', { ...values, action: 'profile', color: profileColor })
      await refresh()
      setDialog(null)
      setNotice('Looking good. Your profile has been updated.')
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Please try again.')
    } finally {
      setBusy(false)
    }
  }
  async function signOut() {
    try {
      await postJSON('/api/session', { action: 'logout' })
      await refresh()
      setDialog(null)
      setNotice('You’re signed out. See you around.')
    } catch {
      setNotice('Could not sign out. Please try again.')
    }
  }

  return (
    <main className="flex h-dvh min-h-[540px] overflow-hidden bg-[#141519] font-sans text-[#eeeef1] selection:bg-[#b3f8bd]/25">
      {/* Workspace switcher */}
      <nav
        aria-label="Workspace navigation"
        className="z-30 hidden w-[76px] shrink-0 flex-col items-center border-r border-white/5 bg-[#101114] py-5 sm:flex"
      >
        <button
          title="About Orbit"
          aria-label="About Orbit"
          onClick={() => openDialog('about')}
          className="flex size-11 items-center justify-center text-[#b3f8bd] transition hover:rotate-12"
        >
          <Orbit size={35} strokeWidth={1.8} />
        </button>
        <div className="my-5 h-px w-8 bg-white/10" />
        <div className="relative">
          <span className="absolute top-3 -left-[15px] h-6 w-[3px] rounded-r-full bg-[#b3f8bd] shadow-[0_0_12px_#b3f8bd66]" />
          <button
            onClick={() => {
              setChannelId(null)
              setSearch('')
              setPinned(false)
            }}
            aria-label="The Creative Corner workspace"
            title="The Creative Corner"
            className="relative flex size-12 items-center justify-center overflow-hidden rounded-[16px] border border-[#c8f1d0]/30 bg-linear-to-br from-[#4c6b55] to-[#243e2d] text-[#d5fadc] shadow-[0_0_18px_#99d6a512]"
          >
            <Sparkles size={24} strokeWidth={1.4} />
            <span className="absolute right-1.5 bottom-1.5 size-1 rounded-full bg-[#c3f8ca]" />
          </button>
        </div>
        <button
          onClick={() => requireAccount(() => openDialog('channel'))}
          aria-label="Create a channel"
          title="Create a channel"
          className="mt-3 flex size-12 items-center justify-center rounded-[17px] border border-dashed border-white/15 text-[#8b8d99] transition hover:border-[#b3f8bd]/40 hover:bg-[#b3f8bd]/5 hover:text-[#b3f8bd]"
        >
          <Plus size={23} strokeWidth={1.5} />
        </button>
        <button
          onClick={() => openDialog('browse')}
          aria-label="Explore channels"
          title="Explore channels"
          className="mt-3 flex size-12 items-center justify-center rounded-[17px] bg-[#1b1d22] text-[#90939f] transition hover:text-[#b3f8bd]"
        >
          <Compass size={23} strokeWidth={1.5} />
        </button>
        <div className="mt-auto flex flex-col items-center gap-4">
          <button
            onClick={() => openDialog('help')}
            title="Orbit help"
            aria-label="Orbit help"
            className="flex size-8 items-center justify-center rounded-full border border-[#555862] text-sm text-[#9c9faa]"
          >
            ?
          </button>
          <span className="text-[8px] font-medium tracking-[.15em] text-[#4e515e]">ORBIT</span>
        </div>
      </nav>

      {mobileNav && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileNav(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      {/* Channel sidebar */}
      <aside
        aria-label="Channels"
        className={`${mobileNav ? 'fixed inset-y-0 left-0 z-40 flex shadow-2xl sm:left-[76px]' : 'hidden'} w-[248px] shrink-0 flex-col border-r border-white/6 bg-[#1a1b20] lg:relative lg:flex`}
      >
        <div className="flex h-[67px] shrink-0 items-center justify-between px-5">
          <button
            onClick={() => openDialog('about')}
            className="flex items-center gap-2.5 text-[16px] font-semibold tracking-[-.4px]"
          >
            The Creative Corner <ChevronDown size={15} className="text-[#898c98]" />
          </button>
          <button
            className="text-[#8d909d] lg:hidden"
            aria-label="Close channels"
            onClick={() => setMobileNav(false)}
          >
            <PanelLeftClose size={17} />
          </button>
        </div>
        <div className="px-3">
          <div className="relative h-[113px] overflow-hidden rounded-xl border border-[#b3f8bd]/10 bg-[#242f29]">
            <OrbitArt small />
            <div className="absolute bottom-3.5 left-3.5 z-10">
              <span className="mb-1.5 inline-flex items-center gap-1 rounded-md border border-[#d2ffdc]/20 bg-[#203025]/60 px-1.5 py-0.5 text-[8px] font-medium tracking-wider text-[#cdf3d4]">
                <Globe2 size={9} />
                COMMUNITY
              </span>
              <p className="text-[13px] leading-[18px] font-medium text-[#e1f4e5]">
                Good people.
                <br />
                Great possibilities.
              </p>
            </div>
          </div>
          <button
            onClick={() => openDialog('invite')}
            className="my-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/9 bg-white/3 py-2 text-[11px] font-medium text-[#cdced6] transition hover:border-[#b3f8bd]/25 hover:text-[#b3f8bd]"
          >
            <Users size={13} />
            Invite your people <Plus size={12} className="ml-4 text-[#818490]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pt-1 pb-4">
          <button
            onClick={() => openDialog('browse')}
            className="mb-5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] text-[#a4a6b2] transition hover:bg-white/4 hover:text-white"
          >
            <Compass size={17} strokeWidth={1.5} />
            Browse channels
          </button>
          {(
            [
              ['information', 'GET STARTED'],
              ['conversation', 'THE CONVERSATION'],
              ['creative', 'CREATIVE SPACE'],
            ] as const
          ).map(([category, label]) => (
            <div key={category} className="mb-6">
              <div className="mb-2 flex items-center justify-between px-1">
                <button
                  onClick={() =>
                    setCollapsed((value) =>
                      value.includes(category)
                        ? value.filter((item) => item !== category)
                        : [...value, category],
                    )
                  }
                  className="flex items-center gap-1.5 text-[9px] font-semibold tracking-[.11em] text-[#777a87]"
                >
                  {collapsed.includes(category) ? (
                    <ChevronRight size={11} />
                  ) : (
                    <ChevronDown size={11} />
                  )}
                  {label}
                </button>
                <button
                  title={`Add a channel to ${label.toLowerCase()}`}
                  aria-label={`Add a channel to ${label.toLowerCase()}`}
                  className="text-[#777a87] hover:text-[#b3f8bd]"
                  onClick={() => requireAccount(() => openDialog('channel'))}
                >
                  <Plus size={13} />
                </button>
              </div>
              {!collapsed.includes(category) &&
                data.channels
                  .filter((item) => item.category === category)
                  .map((item) => {
                    const selected = item.id === data.selected
                    const ChannelIcon =
                      item.name === 'welcome'
                        ? BookOpen
                        : item.name === 'announcements'
                          ? Megaphone
                          : Hash
                    return (
                      <button
                        key={item.id}
                        onClick={() => chooseChannel(item)}
                        className={`relative my-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-[8px] text-left text-[12px] transition ${selected ? 'bg-[#b3f8bd]/9 font-medium text-[#c7f4ce]' : 'text-[#9395a3] hover:bg-white/4 hover:text-[#dedee6]'}`}
                      >
                        {selected && (
                          <span className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-full bg-[#b3f8bd]" />
                        )}
                        <ChannelIcon
                          size={16}
                          strokeWidth={1.6}
                          className={selected ? 'text-[#b3f8bd]' : 'text-[#777a88]'}
                        />
                        <span className="truncate">{item.name}</span>
                        {selected && (
                          <span className="ml-auto size-1.5 rounded-full bg-[#b3f8bd]" />
                        )}
                      </button>
                    )
                  })}
              {!collapsed.includes(category) && loading && !data.channels.length && (
                <div className="mx-3 mt-3 h-4 animate-pulse rounded bg-white/5" />
              )}
            </div>
          ))}
          <div className="mb-1 flex items-center gap-1.5 px-1 text-[9px] font-semibold tracking-[.11em] text-[#777a87]">
            <ChevronDown size={11} />
            BEYOND TEXT
          </div>
          <button
            onClick={() => openRecording('voice')}
            className="mt-2 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] text-[#9395a3] transition hover:bg-white/4 hover:text-white"
          >
            <AudioLines size={16} strokeWidth={1.5} />
            Voice notes
            <span className="ml-auto rounded bg-[#c0aff4]/10 px-1.5 py-0.5 text-[8px] font-medium text-[#baaaef]">
              TRY IT
            </span>
          </button>
          <button
            onClick={() => openRecording('video')}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12px] text-[#9395a3] transition hover:bg-white/4 hover:text-white"
          >
            <Video size={16} strokeWidth={1.5} />
            Video messages
          </button>
        </div>
        <div className="mx-3 mb-3 rounded-xl border border-[#bca5ff]/10 bg-linear-to-br from-[#2c273d] to-[#24232e] px-3.5 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-[#e0d7f7]">
            <Sparkles size={14} className="text-[#c3a8f9]" />A space that’s truly you.
          </div>
          <p className="text-[10px] leading-[17px] text-[#9d95b0]">
            Your name. Your colors. Your corner.
          </p>
          <button
            onClick={() => requireAccount(() => openDialog('profile'))}
            className="mt-2.5 flex items-center gap-2 text-[10px] font-medium text-[#d3c0f3]"
          >
            Make it yours
            <ArrowUpRight size={12} />
          </button>
        </div>
        <div className="flex h-[68px] shrink-0 items-center gap-2.5 border-t border-white/5 bg-[#16171c] px-3.5">
          <button
            onClick={() => (data.user ? openDialog('profile') : setAuth('login'))}
            aria-label={data.user ? 'Edit your profile' : 'Sign in'}
          >
            <Avatar member={data.user} size="sm" active={Boolean(data.user)} />
          </button>
          <button
            onClick={() => (data.user ? openDialog('profile') : setAuth('login'))}
            className="min-w-0 flex-1 text-left"
          >
            <span className="block truncate text-[11px] font-semibold">
              {data.user?.displayName || 'Your next chapter'}
            </span>
            <span className="block text-[9px] text-[#8c8f9c]">
              {data.user ? 'In your orbit' : 'Sign in to get started'}
            </span>
          </button>
          <IconButton
            icon={Settings2}
            label="User settings"
            onClick={() => requireAccount(() => openDialog('profile'))}
            className="!size-6"
          />
        </div>
      </aside>

      {/* Conversation */}
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="z-20 flex h-[67px] shrink-0 items-center gap-3 border-b border-white/6 bg-[#17181d] px-4 sm:px-6">
          <IconButton
            icon={Menu}
            label="Show channels"
            onClick={() => setMobileNav(true)}
            className="lg:hidden"
          />
          <Hash size={23} className="shrink-0 text-[#808390]" strokeWidth={1.5} />
          <h1 className="shrink-0 text-[15px] font-semibold tracking-[-.3px]">
            {channel?.name || 'general'}
          </h1>
          <span className="mx-1 hidden h-5 w-px shrink-0 bg-white/10 xl:block" />
          <p className="hidden min-w-0 truncate text-[11px] text-[#888b98] xl:block">
            {channel?.description || 'A little bit of everything. Make yourself at home.'}
          </p>
          <div className="ml-auto flex items-center gap-1.5">
            <IconButton
              icon={Pin}
              label={pinned ? 'Show all messages' : 'Show pinned messages'}
              active={pinned}
              onClick={() => setPinned(!pinned)}
            />
            <IconButton
              icon={Users}
              label={showMembers ? 'Hide member list' : 'Show member list'}
              active={showMembers}
              onClick={() => setShowMembers(!showMembers)}
              className="hidden md:flex"
            />
            <div className="mx-1 hidden h-5 w-px bg-white/8 sm:block" />
            <label className="relative ml-1 hidden w-36 items-center md:flex 2xl:w-[174px]">
              <Search size={13} className="absolute left-2.5 text-[#7a7d8b]" />
              <input
                ref={searchInput}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                aria-label="Search this conversation"
                className="h-[29px] w-full rounded-md border border-white/5 bg-[#101115] pr-10 pl-8 text-[11px] text-[#cbccd5] outline-none placeholder:text-[#6e7180] focus:border-[#b3f8bd]/30"
              />
              {search ? (
                <button
                  className="absolute right-2 text-[#8b8e9c]"
                  aria-label="Clear search"
                  onClick={() => setSearch('')}
                >
                  <X size={12} />
                </button>
              ) : (
                <span className="absolute right-2 flex items-center gap-0.5 rounded border border-white/8 px-1 py-0.5 text-[8px] text-[#656977]">
                  <Command size={8} />K
                </span>
              )}
            </label>
            <IconButton
              icon={Info}
              label="About this channel"
              onClick={() => openDialog('about')}
              className="ml-1"
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col bg-[#191a1f]">
            {!data.user && !loading && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#b3f8bd]/8 bg-[#b3f8bd]/4 px-5 py-2">
                <p className="flex items-center gap-2 text-[10px] text-[#a9b8ae]">
                  <Sparkles size={12} className="shrink-0 text-[#b3f8bd]" />
                  <span>
                    You’re in good company.{' '}
                    <span className="hidden sm:inline">Join the conversation.</span>
                  </span>
                </p>
                <button
                  onClick={() => setAuth('signup')}
                  className="flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-[#b3f8bd]"
                >
                  Create an account
                  <ArrowRight size={12} />
                </button>
              </div>
            )}
            <div
              ref={scroll}
              className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto scroll-smooth"
            >
              <div className="px-5 pt-6 sm:px-7">
                <div className="relative flex min-h-[152px] items-center overflow-hidden rounded-xl border border-[#b3f8bd]/10 bg-linear-to-r from-[#222e27] via-[#202a25] to-[#202622] px-6 py-6">
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(#c5ffd005_1px,transparent_1px),linear-gradient(90deg,#c5ffd005_1px,transparent_1px)] bg-size-[25px_25px]"
                  />
                  <OrbitArt />
                  <div className="relative z-10 max-w-[92%] sm:max-w-[70%]">
                    <p className="mb-2.5 flex items-center gap-1.5 text-[8px] font-semibold tracking-[.19em] text-[#a4c8ad]">
                      <span className="size-1 rounded-full bg-[#b3f8bd]" />A LITTLE SPACE FOR BIG
                      IDEAS
                    </p>
                    <h2 className="text-[24px] leading-8 font-semibold tracking-[-.9px] text-[#ecf6ed]">
                      You belong in the conversation.
                    </h2>
                    <p className="mt-2 max-w-80 text-[11px] leading-[19px] text-[#a1b3a6]">
                      Share a thought. Send a voice note. Find your people.
                      <br className="hidden 2xl:block" /> This is your corner of the internet.
                    </p>
                  </div>
                </div>
                <div className="mt-6 mb-5 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Hash size={20} className="text-[#858895]" strokeWidth={1.7} />
                      <h2 className="text-[19px] font-semibold tracking-[-.6px]">
                        Welcome to {channel?.name || 'general'}
                      </h2>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#838694]">
                      {channel?.description || 'This is where the good conversations happen.'}
                    </p>
                  </div>
                  <button
                    onClick={() => openDialog('invite')}
                    className="mt-1 flex shrink-0 items-center gap-1.5 rounded-md border border-white/8 px-2 py-1.5 text-[9px] text-[#9b9eaa] transition hover:border-[#b3f8bd]/20 hover:text-[#b3f8bd]"
                  >
                    <Users size={11} />
                    <span className="hidden sm:inline">Invite friends</span>
                  </button>
                </div>
              </div>

              {pinned && (
                <div className="mx-5 mb-4 flex items-center justify-between rounded-lg border border-[#c2aff4]/15 bg-[#c2aff4]/5 px-3 py-2 text-[11px] text-[#c2aff4]">
                  <span className="flex items-center gap-2">
                    <Pin size={13} />
                    Pinned messages
                  </span>
                  <button onClick={() => setPinned(false)} aria-label="Close pinned messages">
                    <X size={14} />
                  </button>
                </div>
              )}
              {search && (
                <p className="px-7 pb-4 text-[11px] text-[#8e919f]">
                  {currentMessages.length} {currentMessages.length === 1 ? 'result' : 'results'} for{' '}
                  <span className="text-[#c5c7cf]">“{search}”</span>
                </p>
              )}
              {loadError ? (
                <div className="mx-7 my-5 rounded-xl border border-red-300/10 bg-red-400/5 p-6 text-center">
                  <p className="text-sm text-red-200">{loadError}</p>
                  <button
                    onClick={() => {
                      setLoading(true)
                      void refresh(true)
                    }}
                    className="mt-4 text-xs font-medium text-[#b3f8bd]"
                  >
                    Try again
                  </button>
                </div>
              ) : loading && !data.messages.length ? (
                <div className="space-y-6 px-7 py-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="flex animate-pulse gap-3">
                      <div className="size-10 rounded-xl bg-white/5" />
                      <div className="flex-1 space-y-3 pt-1">
                        <div className="h-2.5 w-24 rounded bg-white/6" />
                        <div className="h-2.5 w-4/5 rounded bg-white/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {currentMessages.length > 0 && (
                    <div className="mx-7 mb-5 flex items-center gap-3">
                      <span className="h-px flex-1 bg-white/7" />
                      <span className="text-[9px] font-medium text-[#777a88]">
                        {new Date(currentMessages[0].createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="h-px flex-1 bg-white/7" />
                    </div>
                  )}
                  <div className="pb-6">
                    {currentMessages.map((message) => {
                      const author =
                        typeof message.author === 'object'
                          ? message.author
                          : data.members.find((person) => person.id === message.author)
                      const messageReactions = data.reactions.filter(
                        (reaction) => reaction.message === message.id,
                      )
                      const isMine = author?.id === data.user?.id
                      return (
                        <article
                          key={message.id}
                          className="group relative flex gap-3 px-5 py-[11px] transition-colors hover:bg-white/2 sm:px-7"
                        >
                          <button
                            aria-label={`View ${author?.displayName || 'member'} profile`}
                            onClick={() => author && setMember(author)}
                            className="h-fit"
                          >
                            <Avatar member={author} />
                          </button>
                          <div className="min-w-0 flex-1 pt-0.5">
                            <div className="mb-1.5 flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => author && setMember(author)}
                                className={`text-[12px] font-semibold ${author?.color === 'mint' ? 'text-[#b9e7c2]' : author?.color === 'violet' ? 'text-[#cab9ef]' : author?.color === 'peach' ? 'text-[#e5b8a0]' : author?.color === 'blue' ? 'text-[#a9cae7]' : author?.color === 'pink' ? 'text-[#e3a8c5]' : 'text-[#e2d7a3]'}`}
                              >
                                {author?.displayName || 'Community member'}
                              </button>
                              {author?.isGuide && (
                                <span className="rounded border border-[#b3f8bd]/10 bg-[#b3f8bd]/7 px-1 py-px text-[7px] font-semibold tracking-wider text-[#a5d9b0]">
                                  GUIDE
                                </span>
                              )}
                              {isMine && <span className="text-[8px] text-[#747885]">you</span>}
                              <time
                                dateTime={message.createdAt}
                                className="text-[9px] text-[#686c7b]"
                              >
                                {new Date(message.createdAt).toLocaleTimeString('en-US', {
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </time>
                              {message.pinned && <Pin size={10} className="text-[#77718d]" />}
                            </div>
                            {message.body && (
                              <p className="max-w-[740px] text-[12px] leading-[21px] whitespace-pre-wrap text-[#b7b9c5] wrap-anywhere">
                                {message.body}
                              </p>
                            )}
                            {message.kind !== 'text' &&
                              (data.user ? (
                                message.attachment && typeof message.attachment === 'object' ? (
                                  message.kind === 'voice' ? (
                                    <VoicePlayer
                                      src={`/api/clips?id=${encodeURIComponent(message.attachment.id)}`}
                                      duration={message.duration || 0}
                                    />
                                  ) : (
                                    <video
                                      controls
                                      playsInline
                                      preload="metadata"
                                      src={`/api/clips?id=${encodeURIComponent(message.attachment.id)}`}
                                      className="mt-3 max-h-64 w-full max-w-md rounded-xl border border-white/10 bg-black"
                                    />
                                  )
                                ) : (
                                  <p className="mt-2 text-xs text-[#838694]">
                                    This clip is unavailable.
                                  </p>
                                )
                              ) : (
                                <button
                                  onClick={() => setAuth('signup')}
                                  className="mt-2 flex items-center gap-2 rounded-xl border border-[#c0aff4]/15 bg-[#c0aff4]/5 px-4 py-3 text-[11px] text-[#c2aff4]"
                                >
                                  {message.kind === 'voice' ? (
                                    <Mic size={16} />
                                  ) : (
                                    <Video size={16} />
                                  )}
                                  Sign in to play this{' '}
                                  {message.kind === 'voice' ? 'voice note' : 'video clip'}
                                  <ArrowRight size={13} />
                                </button>
                              ))}
                            {messageReactions.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1.5">
                                {Object.entries(reactionIcons).map(([kind, ReactionIcon]) => {
                                  const reactions = messageReactions.filter(
                                    (reaction) => reaction.kind === kind,
                                  )
                                  if (!reactions.length) return null
                                  const reacted = reactions.some(
                                    (reaction) => reaction.author === data.user?.id,
                                  )
                                  return (
                                    <button
                                      key={kind}
                                      title={`${reactions.length} ${kind} ${reactions.length === 1 ? 'reaction' : 'reactions'}`}
                                      aria-label={`${reacted ? 'Remove' : 'Add'} ${kind} reaction`}
                                      onClick={() => void react(message.id, kind)}
                                      className={`flex items-center gap-1.5 rounded-md border px-2 py-[3px] text-[9px] transition hover:border-[#b3f8bd]/30 ${reacted ? 'border-[#b3f8bd]/25 bg-[#b3f8bd]/10 text-[#b3f8bd]' : 'border-white/6 bg-white/3 text-[#b5b7c3]'}`}
                                    >
                                      <ReactionIcon
                                        size={12}
                                        strokeWidth={1.7}
                                        className={
                                          kind === 'fire'
                                            ? 'text-[#e5b77d]'
                                            : kind === 'heart'
                                              ? 'text-[#d9a5ba]'
                                              : kind === 'sparkles'
                                                ? 'text-[#c6b4f4]'
                                                : 'text-[#a9cbe5]'
                                        }
                                      />
                                      <span>{reactions.length}</span>
                                    </button>
                                  )
                                })}
                                <button
                                  aria-label="More reactions"
                                  onClick={() =>
                                    setReactionPicker(
                                      reactionPicker === message.id ? null : message.id,
                                    )
                                  }
                                  className="flex items-center justify-center rounded-md border border-dashed border-white/10 px-2 text-[#777b89] hover:text-white"
                                >
                                  <SmilePlus size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="absolute top-0 right-6 z-10 flex items-center rounded-lg border border-white/10 bg-[#23252d] p-0.5 opacity-0 shadow-lg transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                            <IconButton
                              icon={SmilePlus}
                              label={`React to ${author?.displayName || 'member'}'s message`}
                              onClick={() =>
                                setReactionPicker(reactionPicker === message.id ? null : message.id)
                              }
                              className="!size-6 [&_svg]:size-3.5"
                            />
                            <IconButton
                              icon={MessageCircle}
                              label="Reply to message"
                              onClick={() => {
                                setDraft(`@${author?.displayName || 'member'} `)
                                composer.current?.focus()
                              }}
                              className="!size-6 [&_svg]:size-3.5"
                            />
                            <IconButton
                              icon={Copy}
                              label="Copy message"
                              onClick={() =>
                                void navigator.clipboard
                                  .writeText(message.body || `[${message.kind} message]`)
                                  .then(() => setNotice('Message copied.'))
                                  .catch(() => setNotice('Clipboard access is unavailable.'))
                              }
                              className="!size-6 [&_svg]:size-3.5"
                            />
                          </div>
                          {reactionPicker === message.id && (
                            <div className="absolute top-8 right-6 z-20 flex gap-1 rounded-xl border border-white/12 bg-[#292b34] p-2 shadow-xl">
                              {Object.entries(reactionIcons).map(([kind, ReactionIcon]) => (
                                <button
                                  key={kind}
                                  aria-label={`React with ${kind}`}
                                  title={kind}
                                  onClick={() => void react(message.id, kind)}
                                  className="flex size-9 items-center justify-center rounded-lg text-[#cab9ee] transition hover:bg-[#b3f8bd]/10 hover:text-[#b3f8bd]"
                                >
                                  <ReactionIcon size={19} />
                                </button>
                              ))}
                              <button
                                aria-label="Close reactions"
                                onClick={() => setReactionPicker(null)}
                                className="px-1 text-[#838797]"
                              >
                                <X size={13} />
                              </button>
                            </div>
                          )}
                        </article>
                      )
                    })}
                  </div>
                  {!currentMessages.length && (
                    <div className="flex flex-col items-center px-8 py-10 text-center">
                      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-[#b3f8bd]/6 text-[#b3f8bd]">
                        {pinned ? (
                          <Pin size={23} />
                        ) : search ? (
                          <Search size={23} />
                        ) : (
                          <MessageCircle size={23} />
                        )}
                      </div>
                      <h3 className="text-sm font-medium">
                        {pinned
                          ? 'Nothing pinned. Yet.'
                          : search
                            ? 'No matching conversations.'
                            : 'Big conversations start small.'}
                      </h3>
                      <p className="mt-2 text-xs text-[#858997]">
                        {pinned
                          ? 'Important community messages will live here.'
                          : search
                            ? 'Try a different word or a member’s name.'
                            : 'Be the first to say hello in this channel.'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* Composer */}
            <div className="relative shrink-0 px-5 pt-2 pb-3 sm:px-7">
              {attachments && (
                <div className="absolute bottom-full left-5 z-20 mb-2 w-56 rounded-xl border border-white/10 bg-[#25272f] p-1.5 shadow-xl">
                  <button
                    onClick={() => openRecording('voice')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs text-[#d1d3dd] hover:bg-white/5"
                  >
                    <Mic size={17} className="text-[#b3f8bd]" />
                    Record a voice note
                  </button>
                  <button
                    onClick={() => openRecording('video')}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-xs text-[#d1d3dd] hover:bg-white/5"
                  >
                    <Video size={17} className="text-[#c2aff4]" />
                    Record a video clip
                  </button>
                </div>
              )}
              {quickReplies && (
                <div className="absolute right-6 bottom-full z-20 mb-2 flex flex-wrap gap-2 rounded-xl border border-white/10 bg-[#25272f] p-3 shadow-xl">
                  {['Love this!', 'Thanks for sharing.', 'Tell me more…'].map((reply) => (
                    <button
                      key={reply}
                      onClick={() => {
                        setDraft((value) => `${value}${value ? ' ' : ''}${reply}`)
                        setQuickReplies(false)
                        composer.current?.focus()
                      }}
                      className="rounded-md bg-white/5 px-3 py-2 text-[11px] text-[#d0c1ed] hover:bg-white/10"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  void sendMessage()
                }}
                className="rounded-xl border border-white/8 bg-[#24262e] p-3 transition focus-within:border-[#b3f8bd]/25 focus-within:ring-2 focus-within:ring-[#b3f8bd]/3"
              >
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    aria-label="Attach a voice or video message"
                    onClick={() => {
                      setAttachments(!attachments)
                      setQuickReplies(false)
                    }}
                    className={`mt-1 flex size-[21px] shrink-0 items-center justify-center rounded-full border transition ${attachments ? 'rotate-45 border-[#b3f8bd] text-[#b3f8bd]' : 'border-[#747987] text-[#9b9fac] hover:border-white hover:text-white'}`}
                  >
                    <Plus size={14} strokeWidth={1.6} />
                  </button>
                  <textarea
                    ref={composer}
                    value={draft}
                    maxLength={4000}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (
                        event.key === 'Enter' &&
                        !event.shiftKey &&
                        !event.nativeEvent.isComposing
                      ) {
                        event.preventDefault()
                        void sendMessage()
                      }
                    }}
                    aria-label={`Message ${channel?.name || 'general'}`}
                    placeholder={`Message #${channel?.name || 'general'}`}
                    rows={1}
                    className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 pt-1.5 text-[12px] leading-5 text-[#dedee5] outline-none placeholder:text-[#777b8a]"
                  />
                  <div className="mt-0.5 hidden items-center gap-1 sm:flex">
                    <IconButton
                      icon={Mic}
                      label="Record a voice message"
                      onClick={() => openRecording('voice')}
                      className="!size-7 [&_svg]:size-4"
                    />
                    <IconButton
                      icon={Video}
                      label="Record a video message"
                      onClick={() => openRecording('video')}
                      className="!size-7 [&_svg]:size-4"
                    />
                    <IconButton
                      icon={SmilePlus}
                      label="Quick replies"
                      active={quickReplies}
                      onClick={() => {
                        setQuickReplies(!quickReplies)
                        setAttachments(false)
                      }}
                      className="!size-7 [&_svg]:size-4"
                    />
                    <span className="mx-1 h-4 w-px bg-white/8" />
                  </div>
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending || !data.selected}
                    aria-label="Send message"
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#b3f8bd] text-[#243329] transition hover:bg-[#d0ffd7] disabled:bg-[#b3f8bd]/50 disabled:text-[#1c2922]/70"
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-2 flex items-center justify-between px-1 text-[8px] text-[#676c7b]">
                <span>
                  <span className="font-medium text-[#9296a3]">Enter</span> to send{' '}
                  <span className="mx-1.5 text-[#414550]">·</span>
                  <span className="font-medium text-[#9296a3]">Shift + Enter</span> for a new line
                </span>
                <span className="flex items-center gap-1">
                  <ShieldCheck size={10} />A little kindness goes a long way.
                </span>
              </div>
            </div>
          </div>

          {/* Members and channel details */}
          {showMembers && (
            <aside
              aria-label="Community members"
              className="hidden w-[230px] shrink-0 flex-col overflow-y-auto border-l border-white/5 bg-[#17181d] px-4 py-5 md:flex 2xl:w-[252px]"
            >
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-[10px] font-semibold tracking-[.12em] text-[#b2b4c0]">
                  IN THIS CORNER
                </h2>
                <span className="rounded-md bg-white/4 px-1.5 py-0.5 text-[9px] text-[#858998]">
                  {data.members.length}
                </span>
              </div>
              <div className="mb-6 rounded-xl border border-white/6 bg-white/2 p-3.5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[#b3f8bd]/8 text-[#b3f8bd]">
                    <Hash size={16} />
                  </span>
                  <span className="text-[12px] font-medium">{channel?.name || 'general'}</span>
                </div>
                <p className="text-[10px] leading-[18px] text-[#838795]">
                  {channel?.description || 'A little bit of everything. Make yourself at home.'}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[9px] text-[#a4b9a9]">
                  <Globe2 size={11} />
                  Open to good company
                </div>
              </div>
              {[true, false].map((guide) => {
                const members = data.members.filter((item) => Boolean(item.isGuide) === guide)
                if (!members.length) return null
                return (
                  <div key={String(guide)} className="mb-6">
                    <h3 className="mb-3 flex items-center gap-1.5 text-[8px] font-semibold tracking-[.13em] text-[#747987]">
                      {guide && <ShieldCheck size={11} />}{' '}
                      {guide ? 'COMMUNITY GUIDES' : 'THE CREATORS'}{' '}
                      <span className="ml-0.5 text-[#565d6a]">— {members.length}</span>
                    </h3>
                    <div className="space-y-0.5">
                      {members.map((person) => (
                        <button
                          key={person.id}
                          onClick={() => setMember(person)}
                          className="flex w-full items-center gap-2.5 rounded-lg py-2 text-left transition hover:bg-white/3"
                        >
                          <Avatar member={person} size="sm" active={person.id === data.user?.id} />
                          <div className="min-w-0">
                            <span className="block truncate text-[11px] font-medium text-[#c1c4ce]">
                              {person.displayName}
                              {person.id === data.user?.id && (
                                <span className="ml-1 text-[8px] text-[#737989]">(you)</span>
                              )}
                            </span>
                            <span className="mt-0.5 block max-w-[143px] truncate text-[9px] text-[#676e7e]">
                              {person.bio || 'Part of the conversation'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              <div className="mt-auto pt-6">
                <div className="relative overflow-hidden rounded-xl border border-[#c4aff4]/12 bg-linear-to-br from-[#262331] to-[#1c1b24] p-4">
                  <div className="absolute -top-7 -right-7 size-24 rounded-full border border-[#c4aff4]/10" />
                  <div className="absolute -top-3 -right-3 size-16 rounded-full border border-[#c4aff4]/10" />
                  <div className="mb-3 flex size-8 items-center justify-center rounded-xl bg-[#c4aff4]/10 text-[#c4aff4]">
                    <AudioLines size={17} strokeWidth={1.5} />
                  </div>
                  <p className="text-[12px] font-medium text-[#e1daef]">
                    Less typing.
                    <br />
                    More you.
                  </p>
                  <p className="mt-2 text-[10px] leading-[17px] text-[#928a9f]">
                    Some things sound better
                    <br />
                    in your own voice.
                  </p>
                  <button
                    onClick={() => openRecording('voice')}
                    className="mt-4 flex items-center gap-2 text-[10px] font-medium text-[#c8b5eb]"
                  >
                    Send a voice note
                    <ArrowUpRight size={12} />
                  </button>
                </div>
                <div className="mt-5 flex items-center justify-center gap-1.5 text-[8px] text-[#555e6d]">
                  <Orbit size={11} />A little closer, even from here.
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>

      {/* All account and community flows stay in context. */}
      {auth && (
        <AuthModal
          initialMode={auth}
          onClose={() => setAuth(null)}
          onSuccess={async () => {
            await refresh()
            setNotice('You’re in. Welcome to your corner.')
          }}
        />
      )}
      {recording && (
        <Recorder kind={recording} onClose={() => setRecording(null)} onSend={sendClip} />
      )}
      {dialog === 'channel' && (
        <Modal title="Create a channel" onClose={() => setDialog(null)}>
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-[#b3f8bd]/10 text-[#b3f8bd]">
            <Hash size={24} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Make room for an idea.</h2>
          <p className="mt-2 text-xs leading-6 text-[#8e93a1]">
            Create a public channel in The Creative Corner.
          </p>
          <form onSubmit={submitChannel} className="mt-6 space-y-4">
            <label className="block space-y-2 text-xs text-[#c3c7d3]">
              <span>Channel name</span>
              <input
                name="name"
                required
                minLength={2}
                maxLength={32}
                placeholder="the-next-big-thing"
                className={inputClass}
              />
            </label>
            <label className="block space-y-2 text-xs text-[#c3c7d3]">
              <span>What’s it about?</span>
              <textarea
                name="description"
                maxLength={180}
                rows={3}
                placeholder="Give the conversation a little direction."
                className={`${inputClass} resize-none`}
              />
            </label>
            {formError && (
              <p role="alert" className="text-xs text-red-300">
                {formError}
              </p>
            )}
            <button disabled={busy} className={`${primaryClass} w-full`}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}Create
              channel
            </button>
          </form>
        </Modal>
      )}
      {dialog === 'browse' && (
        <Modal title="Browse channels" onClose={() => setDialog(null)} wide>
          <p className="mb-2 text-[10px] font-semibold tracking-[.16em] text-[#b3f8bd]">
            FIND YOUR CONVERSATION
          </p>
          <h2 className="text-2xl font-semibold tracking-tight">There’s a corner for you.</h2>
          <div className="relative mt-5">
            <Search size={16} className="absolute top-3.5 left-3 text-[#747d8d]" />
            <input
              autoFocus
              value={browseSearch}
              onChange={(event) => setBrowseSearch(event.target.value)}
              aria-label="Search channels"
              placeholder="Find a channel…"
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="mt-4 space-y-1">
            {data.channels
              .filter((item) =>
                `${item.name} ${item.description}`
                  .toLowerCase()
                  .includes(browseSearch.toLowerCase()),
              )
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    chooseChannel(item)
                    setDialog(null)
                  }}
                  className="group flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#b3f8bd]/6 text-[#b3f8bd]">
                    <Hash size={19} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.name}</span>
                    <span className="mt-1 block truncate text-[11px] text-[#868e9f]">
                      {item.description}
                    </span>
                  </span>
                  <ArrowRight size={16} className="text-[#5e687a] group-hover:text-[#b3f8bd]" />
                </button>
              ))}
          </div>
          {!data.channels.filter((item) =>
            `${item.name} ${item.description}`.toLowerCase().includes(browseSearch.toLowerCase()),
          ).length && (
            <p className="py-6 text-center text-xs text-[#949aaa]">
              No channels found. Try another search.
            </p>
          )}
        </Modal>
      )}
      {dialog === 'invite' && (
        <Modal title="Invite your people" onClose={() => setDialog(null)}>
          <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#c4aff4]/10 text-[#c4aff4]">
            <Users size={25} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Better with your people.</h2>
          <p className="mt-3 text-sm leading-6 text-[#969dac]">
            Know someone who’d feel at home here? Send them a little invitation to The Creative
            Corner.
          </p>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(window.location.origin)
                setCopied(true)
              } catch {
                setFormError('Clipboard access is blocked. Copy the address from your browser.')
              }
            }}
            className={`${primaryClass} mt-6 w-full`}
          >
            {copied ? <CheckCheck size={17} /> : <Copy size={17} />}
            {copied ? 'Invitation link copied' : 'Copy invitation link'}
          </button>
          <p className="mt-4 text-center text-[10px] text-[#6e7889]">
            Public community · Everyone’s welcome
          </p>
          {formError && <p className="mt-4 text-xs text-red-300">{formError}</p>}
        </Modal>
      )}
      {dialog === 'profile' && data.user && (
        <Modal title="Your profile" onClose={() => setDialog(null)}>
          <Avatar member={{ ...data.user, color: profileColor as Member['color'] }} size="lg" />
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">A little more you.</h2>
          <p className="mt-2 text-xs text-[#8c96a7]">Make your corner feel like home.</p>
          <form onSubmit={saveProfile} className="mt-6 space-y-4">
            <label className="block space-y-2 text-xs text-[#bec5d2]">
              <span>Display name</span>
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={32}
                defaultValue={data.user.displayName}
                className={inputClass}
              />
            </label>
            <label className="block space-y-2 text-xs text-[#bec5d2]">
              <span>A little about you</span>
              <textarea
                name="bio"
                maxLength={160}
                defaultValue={data.user.bio || ''}
                rows={2}
                placeholder="What brings you to this corner?"
                className={`${inputClass} resize-none`}
              />
            </label>
            <div>
              <p className="mb-3 text-xs text-[#bec5d2]">Your color</p>
              <div className="flex gap-3">
                {Object.entries(avatarColors).map(([color, classes]) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`${color} avatar`}
                    aria-pressed={color === profileColor}
                    onClick={() => setProfileColor(color)}
                    className={`flex size-9 items-center justify-center rounded-xl bg-linear-to-br ${classes} ${color === profileColor ? 'ring-2 ring-[#d8e6dc] ring-offset-2 ring-offset-[#1a1c21]' : ''}`}
                  >
                    {color === profileColor && <Check size={15} />}
                  </button>
                ))}
              </div>
            </div>
            {formError && (
              <p role="alert" className="text-xs text-red-300">
                {formError}
              </p>
            )}
            <button disabled={busy} className={`${primaryClass} mt-2 w-full`}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}Save your
              profile
            </button>
          </form>
          <button
            onClick={() => void signOut()}
            className="mt-5 flex w-full items-center justify-center gap-2 text-xs text-[#a9a0a7] hover:text-red-300"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </Modal>
      )}
      {dialog === 'about' && (
        <Modal title="About The Creative Corner" onClose={() => setDialog(null)} wide>
          <div className="relative mb-6 h-36 overflow-hidden rounded-xl border border-[#b3f8bd]/10 bg-[#24382b]">
            <OrbitArt />
            <div className="absolute bottom-5 left-5">
              <p className="mb-2 text-[9px] tracking-[.18em] text-[#9bbfa5]">
                GOOD PEOPLE. GREAT POSSIBILITIES.
              </p>
              <h2 className="text-[25px] font-semibold tracking-tight">The Creative Corner</h2>
            </div>
          </div>
          <p className="text-sm leading-7 text-[#a3abba]">
            A shared space for designers, developers, and people with a little creative curiosity.
            Trade ideas, share what you’re making, or just stay for the conversation.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/3 p-4">
              <span className="text-xl font-semibold text-[#b3f8bd]">{data.members.length}</span>
              <p className="mt-1 text-[10px] text-[#8994a7]">people in our orbit</p>
            </div>
            <div className="rounded-lg bg-white/3 p-4">
              <span className="text-xl font-semibold text-[#c4aff4]">{data.channels.length}</span>
              <p className="mt-1 text-[10px] text-[#8994a7]">ways to connect</p>
            </div>
          </div>
          <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[#7f8b9d]">
            <ShieldCheck size={17} className="mt-1 shrink-0 text-[#b3f8bd]" />
            Keep it kind. Respect each other’s work. Public messages are visible to everyone; your
            email and uploaded clips are for members only.
          </p>
          <button
            onClick={() => {
              setDialog(null)
              if (data.user) setNotice('You’re already part of our orbit. Make yourself at home.')
              else setAuth('signup')
            }}
            className={`${primaryClass} mt-6 w-full`}
          >
            {data.user ? 'You’re in good company' : 'Find your people'}
            <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {dialog === 'help' && (
        <Modal title="A little help" onClose={() => setDialog(null)}>
          <Orbit size={35} className="mb-5 text-[#b3f8bd]" />
          <h2 className="text-2xl font-semibold tracking-tight">Make yourself at home.</h2>
          <div className="mt-6 space-y-5">
            {[
              [
                Hash,
                'Find your conversation',
                'Choose a channel, or explore the community with the compass.',
              ],
              [
                MessageCircle,
                'Say something good',
                'Create an account, type a message, and press Enter to send.',
              ],
              [
                Mic,
                'Make it personal',
                'Use the microphone or camera to record a clip. Preview it before sending.',
              ],
              [
                SmilePlus,
                'Share a little appreciation',
                'Hover over a message to add a heart, spark, flame, or like.',
              ],
            ].map(([Icon, title, body], index) => {
              const HelpIcon = Icon as typeof Hash
              return (
                <div key={index} className="flex gap-3">
                  <HelpIcon size={19} className="mt-0.5 shrink-0 text-[#b5c7ba]" />
                  <div>
                    <h3 className="text-sm font-medium">{String(title)}</h3>
                    <p className="mt-1 text-xs leading-6 text-[#8b97a9]">{String(body)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Modal>
      )}
      {member && (
        <Modal title={`${member.displayName}'s profile`} onClose={() => setMember(null)}>
          <div className="relative -mx-7 -mt-7 mb-[-26px] h-24 overflow-hidden bg-linear-to-br from-[#314c3a] to-[#252b32]">
            <OrbitArt />
          </div>
          <div className="relative w-fit rounded-[25px] border-[5px] border-[#1a1c21]">
            <Avatar member={member} size="lg" active={member.id === data.user?.id} />
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight">{member.displayName}</h2>
          {member.isGuide && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#b3f8bd]/8 px-2 py-1 text-[9px] text-[#b3f8bd]">
              <ShieldCheck size={11} />
              Community guide
            </span>
          )}
          <p className="mt-4 text-sm leading-6 text-[#949fb0]">
            {member.bio || 'Good conversations start with a simple hello.'}
          </p>
          <div className="mt-6 flex items-center gap-2 border-t border-white/6 pt-4 text-[10px] text-[#768397]">
            <Orbit size={13} />
            Part of The Creative Corner
          </div>
          {member.id === data.user?.id && (
            <button
              onClick={() => {
                setMember(null)
                openDialog('profile')
              }}
              className={`${primaryClass} mt-5 w-full`}
            >
              Edit your profile
              <Settings2 size={15} />
            </button>
          )}
        </Modal>
      )}
      {notice && (
        <div
          role="status"
          className="fixed right-5 bottom-5 z-60 flex max-w-sm items-start gap-3 rounded-xl border border-[#b3f8bd]/20 bg-[#252e29] px-4 py-3 text-xs leading-5 text-[#d5eadb] shadow-xl"
        >
          <Info size={16} className="mt-0.5 shrink-0 text-[#b3f8bd]" />
          {notice}
          <button
            aria-label="Dismiss notification"
            onClick={() => setNotice('')}
            className="ml-2 mt-0.5 text-[#9eb8a6]"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </main>
  )
}
