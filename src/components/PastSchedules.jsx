// src/components/PastSchedules.jsx
import { useState, useEffect } from 'react'
import { getAllSchedules, getScheduleByDate, getNotesBySchedule, deleteSchedule } from '../lib/supabase'
import { BG_PATTERN } from '../lib/theme'

export default function PastSchedules({ onOpen, onBack }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [confirmId, setConfirmId] = useState(null) // which schedule is pending delete confirm
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await getAllSchedules()
      setSchedules(data || [])
    } catch {
      setError('Could not load schedules. Check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  async function openSchedule(row) {
    try {
      const full = await getScheduleByDate(row.date)
      const notes = await getNotesBySchedule(full.id)
      onOpen({ ...full, notesMap: notes })
    } catch {
      alert('Could not load this schedule.')
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation() // don't open the schedule
    if (confirmId !== id) { setConfirmId(id); return }
    setDeletingId(id)
    try {
      await deleteSchedule(id)
      setSchedules(prev => prev.filter(s => s.id !== id))
      setConfirmId(null)
    } catch {
      alert('Could not delete. Try again.')
    } finally {
      setDeletingId(null)
    }
  }

  function cancelConfirm(e, id) {
    e.stopPropagation()
    if (confirmId === id) setConfirmId(null)
  }

  function formatDate(dateStr) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    })
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F0E8',
      backgroundImage: BG_PATTERN,
      padding: 'clamp(28px, 5vw, 52px) clamp(16px, 4vw, 28px) 72px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 660, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 40, animation: 'fadeDown 0.6s ease both' }}>
          <button
            onClick={onBack}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', background: 'transparent', border: 'none', color: '#8C6E4B', cursor: 'pointer', padding: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 700, color: '#3B2A1A', lineHeight: 1.1 }}>
            Past<br /><span style={{ color: '#C4622D' }}>Schedules</span>
          </h1>
          <div style={{ width: 48, height: 2, background: '#C4622D', margin: '14px 0 0' }} />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 48, color: '#B0A090', fontFamily: "'DM Mono', monospace", fontSize: 12 }}>Loading…</div>
        )}
        {error && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FFF0F0', border: '1px solid #F0C0C0', color: '#C04040', fontSize: 13 }}>{error}</div>
        )}
        {!loading && !error && schedules.length === 0 && (
          <div style={{ textAlign: 'center', padding: 48, color: '#B0A090' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: '#8C6E4B' }}>No past schedules yet</p>
            <p style={{ fontSize: 13, marginTop: 6 }}>Build your first one to see it here.</p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {schedules.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                opacity: 0, animation: `fadeUp 0.4s ${i * 0.06}s ease forwards`,
              }}
            >
              {/* Main row — clickable to open */}
              <button
                onClick={() => openSchedule(s)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 22px', borderRadius: 14,
                  background: '#FFFFFF', border: '1.5px solid #EDE6DA',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,42,26,0.1)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}
              >
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 15.5, fontWeight: 700, color: '#3B2A1A', marginBottom: 4 }}>
                    {formatDate(s.date)}
                  </div>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#B0A090', letterSpacing: '0.06em' }}>
                    {new Date(s.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </div>
                </div>
                <span style={{ color: '#C4A880', fontSize: 18 }}>→</span>
              </button>

              {/* Delete controls */}
              {confirmId === s.id ? (
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={e => handleDelete(e, s.id)}
                    disabled={deletingId === s.id}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #C04040', background: '#C04040', color: '#FFF0F0', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    {deletingId === s.id ? '…' : 'Confirm'}
                  </button>
                  <button
                    onClick={e => cancelConfirm(e, s.id)}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E0D4C4', background: 'transparent', color: '#B0A090', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={e => handleDelete(e, s.id)}
                  style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E0D4C4', background: 'transparent', color: '#C0A898', cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#C04040'; e.currentTarget.style.color = '#C04040' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E0D4C4'; e.currentTarget.style.color = '#C0A898' }}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
