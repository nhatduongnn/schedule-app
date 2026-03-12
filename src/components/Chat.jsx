// src/components/Chat.jsx
import { useState, useRef, useEffect } from 'react'
import { sendMessage, tryParseSchedule, PROVIDERS, DEFAULT_PROVIDER } from '../lib/claude'
import { BG_PATTERN } from '../lib/theme'
import { connectGoogleCalendar, fetchTodayEvents, formatEventsForPrompt, isConnected, disconnect } from '../lib/googleCalendar'

export default function Chat({ onScheduleReady }) {
  const [provider, setProvider] = useState(DEFAULT_PROVIDER)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey! Describe your day and what you need to get done — I'll build your schedule. You can be as casual as you like: \"I want to work this morning, grab lunch, hit the gym after 5, and go to a pottery class before 9pm.\"",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Google Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [calendarEvents, setCalendarEvents] = useState([]) // raw event objects
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [calendarError, setCalendarError] = useState(null)

  const bottomRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function handleConnectCalendar() {
    setCalendarLoading(true)
    setCalendarError(null)
    try {
      await connectGoogleCalendar()
      const events = await fetchTodayEvents()
      setCalendarEvents(events)
      setCalendarConnected(true)

      // Let the user know calendar was loaded
      const count = events.length
      const eventSummary = count === 0
        ? "No events found on your calendar today."
        : `Found ${count} event${count !== 1 ? 's' : ''} on your calendar today. I'll schedule around them.`

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `📅 Google Calendar connected! ${eventSummary}`,
      }])
    } catch (err) {
      setCalendarError(err.message)
    } finally {
      setCalendarLoading(false)
    }
  }

  function handleDisconnectCalendar() {
    disconnect()
    setCalendarConnected(false)
    setCalendarEvents([])
    setCalendarError(null)
  }

  async function send() {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const nextMessages = [...messages, userMsg]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    setError(null)

    try {
      // Inject calendar events into the first user message if connected
      const calendarPrefix = calendarConnected && calendarEvents.length > 0
        ? formatEventsForPrompt(calendarEvents) + '\n\nUSER REQUEST:\n'
        : ''

      const apiMessages = nextMessages.map((m, idx) => {
        // Prepend calendar context to the first user message only
        if (m.role === 'user' && idx === nextMessages.length - 1 && calendarPrefix) {
          return { role: 'user', content: calendarPrefix + m.content }
        }
        return { role: m.role, content: m.content }
      })

      const reply = await sendMessage(apiMessages, provider)

      const parsed = tryParseSchedule(reply)
      if (parsed?.schedule) {
        onScheduleReady(parsed)
      } else if (reply.includes('"schedule"')) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: "Sorry, your schedule was too long and got cut off mid-generation. Try describing your day again — I'll keep the blocks tighter and combine similar activities where possible."
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const activeProvider = PROVIDERS[provider]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      backgroundImage: BG_PATTERN,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(28px, 5vw, 52px) clamp(16px, 4vw, 24px) 0',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 660, flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ marginBottom: 32, animation: 'fadeDown 0.6s ease both' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: '#B0A090', textTransform: 'uppercase', marginBottom: 10 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, color: '#3B2A1A', lineHeight: 1.1 }}>
            Plan Your<br /><span style={{ color: '#C4622D' }}>Day</span>
          </h1>
          <div style={{ width: 48, height: 2, background: '#C4622D', margin: '14px 0 20px' }} />

          {/* Provider selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: '#B0A090', textTransform: 'uppercase', marginBottom: 8 }}>
              AI Model
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.values(PROVIDERS).map(p => {
                const isActive = provider === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 14px', borderRadius: 10, cursor: 'pointer',
                      border: isActive ? '1.5px solid #3B2A1A' : '1.5px solid #E0D4C4',
                      background: isActive ? '#3B2A1A' : '#FFFFFF',
                      transition: 'all 0.18s',
                    }}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                          color: isActive ? '#F5F0E8' : '#3B2A1A',
                        }}>
                          {p.label}
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em',
                          padding: '2px 7px', borderRadius: 4,
                          background: p.badgeBg,
                          color: isActive ? (p.id !== 'claude' ? '#80CCA0' : '#C4A880') : p.badgeColor,
                          textTransform: 'uppercase',
                        }}>
                          {p.badge}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace", fontSize: 10,
                        color: isActive ? 'rgba(245,240,232,0.5)' : '#B0A090',
                        marginTop: 1,
                      }}>
                        {p.description}
                      </div>
                    </div>
                    {isActive && (
                      <div style={{ marginLeft: 4, width: 7, height: 7, borderRadius: '50%', background: p.id !== 'claude' ? '#80CCA0' : '#C4A880', flexShrink: 0 }} />
                    )}
                  </button>
                )
              })}
            </div>
            {provider === 'claude' && (
              <p style={{ fontSize: 11, color: '#B0A090', marginTop: 7, fontFamily: "'DM Mono', monospace" }}>
                ⚠ Requires ANTHROPIC_API_KEY in your .env.local and Vercel env vars.
              </p>
            )}
          </div>

          {/* Google Calendar integration */}
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: '#B0A090', textTransform: 'uppercase', marginBottom: 8 }}>
              Calendar
            </div>

            {!calendarConnected ? (
              <div>
                <button
                  onClick={handleConnectCalendar}
                  disabled={calendarLoading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 16px', borderRadius: 10, cursor: calendarLoading ? 'default' : 'pointer',
                    border: '1.5px solid #E0D4C4',
                    background: '#FFFFFF',
                    transition: 'all 0.18s',
                    fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500,
                    color: '#3B2A1A',
                  }}
                  onMouseEnter={e => { if (!calendarLoading) { e.currentTarget.style.borderColor = '#3B2A1A' } }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D4C4' }}
                >
                  {calendarLoading ? (
                    <div style={{ width: 14, height: 14, border: '2px solid #E0D4C4', borderTopColor: '#3B2A1A', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  ) : (
                    <span style={{ fontSize: 15 }}>📅</span>
                  )}
                  <span>{calendarLoading ? 'Connecting…' : 'Connect Google Calendar'}</span>
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 9, letterSpacing: '0.08em',
                    padding: '2px 7px', borderRadius: 4,
                    background: 'rgba(59,42,26,0.06)', color: '#8C6E4B',
                    textTransform: 'uppercase',
                  }}>
                    Optional
                  </span>
                </button>
                {calendarError && (
                  <p style={{ fontSize: 11, color: '#C04040', marginTop: 7, fontFamily: "'DM Mono', monospace" }}>
                    ✗ {calendarError}
                  </p>
                )}
                <p style={{ fontSize: 11, color: '#B0A090', marginTop: 6, fontFamily: "'DM Mono', monospace" }}>
                  Let the AI see your existing events and schedule around them.
                </p>
              </div>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 14px', borderRadius: 10,
                border: '1.5px solid #3A7A5A',
                background: 'rgba(58,122,90,0.06)',
              }}>
                <span style={{ fontSize: 15 }}>📅</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, color: '#3B2A1A' }}>
                    Google Calendar connected
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#3A7A5A', marginTop: 1 }}>
                    {calendarEvents.length === 0
                      ? 'No events today'
                      : `${calendarEvents.length} event${calendarEvents.length !== 1 ? 's' : ''} loaded for today`
                    }
                  </div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3A7A5A', flexShrink: 0 }} />
                <button
                  onClick={handleDisconnectCalendar}
                  style={{
                    fontFamily: "'DM Mono', monospace", fontSize: 10,
                    background: 'transparent', border: 'none',
                    color: '#9A8870', cursor: 'pointer', padding: '2px 4px',
                  }}
                  title="Disconnect"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: 14,
                opacity: 0,
                animation: `fadeUp 0.35s ${i * 0.04}s ease forwards`,
              }}
            >
              <div style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                background: msg.role === 'user' ? '#3B2A1A' : '#FFFFFF',
                color: msg.role === 'user' ? '#F5F0E8' : '#3B2A1A',
                fontSize: 14,
                lineHeight: 1.6,
                fontWeight: 300,
                boxShadow: '0 2px 12px rgba(59,42,26,0.08)',
                border: msg.role === 'assistant' ? '1px solid #EDE6DA' : 'none',
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px', animation: 'fadeIn 0.3s ease' }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#C4A880',
                    animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#B0A090', letterSpacing: '0.06em' }}>
                {activeProvider.label} is thinking…
              </span>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 10, background: '#FFF0F0', border: '1px solid #F0C0C0', color: '#C04040', fontSize: 13, marginBottom: 12 }}>
              {error} — check your API key in .env.local and Vercel env vars.
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'linear-gradient(to top, #F5F0E8 80%, transparent)',
          paddingTop: 20, paddingBottom: 28,
        }}>
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-end',
            background: '#FFFFFF',
            borderRadius: 14, padding: '10px 10px 10px 16px',
            border: '1.5px solid #E0D4C4',
            boxShadow: '0 4px 20px rgba(59,42,26,0.08)',
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Describe your day…"
              rows={1}
              style={{
                flex: 1, border: 'none', outline: 'none', resize: 'none',
                background: 'transparent', fontFamily: "'DM Sans', sans-serif",
                fontSize: 14, color: '#3B2A1A', lineHeight: 1.6,
                fontWeight: 300, maxHeight: 120, overflowY: 'auto',
              }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 38, height: 38, borderRadius: 10, border: 'none',
                background: loading || !input.trim() ? '#E0D4C4' : '#3B2A1A',
                color: '#F5F0E8', cursor: loading || !input.trim() ? 'default' : 'pointer',
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s', flexShrink: 0,
              }}
            >
              {loading
                ? <div style={{ width: 14, height: 14, border: '2px solid rgba(245,240,232,0.3)', borderTopColor: '#F5F0E8', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                : '↑'
              }
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#B0A090', textAlign: 'center', marginTop: 8, fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
