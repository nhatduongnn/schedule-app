// src/components/NotePanel.jsx
import { useState, useEffect, useRef } from 'react'
import { saveNote } from '../lib/supabase'

export default function NotePanel({ blockId, scheduleId, initialContent = '', styles }) {
  const [notes, setNotes] = useState(initialContent)
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const timer = useRef(null)

  useEffect(() => {
    setNotes(initialContent)
  }, [initialContent])

  function handleChange(e) {
    const val = e.target.value
    setNotes(val)
    setStatus('idle')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!scheduleId) return
      setStatus('saving')
      try {
        await saveNote(scheduleId, blockId, val)
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
      }
    }, 700)
  }

  const statusLabel = { saving: 'saving…', saved: '✓ saved', error: '✗ error', idle: '' }[status]
  const statusColor = { saving: styles.notesPlaceholder, saved: styles.tagText, error: '#E05050', idle: '' }[status]

  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${styles.accent}`, paddingTop: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
        <span style={{
          fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase',
          opacity: 0.5, fontFamily: "'DM Mono', monospace", color: styles.text,
        }}>
          Notes
        </span>
        {statusLabel && (
          <span style={{ fontSize: 10, color: statusColor, fontFamily: "'DM Mono', monospace", transition: 'color 0.3s' }}>
            {statusLabel}
          </span>
        )}
      </div>
      <textarea
        value={notes}
        onChange={handleChange}
        placeholder="Add notes, to-dos, or reflections…"
        rows={3}
        style={{
          width: '100%',
          background: styles.notesBg,
          border: `1px solid ${styles.accent}`,
          borderRadius: 8,
          padding: '10px 12px',
          color: styles.notesText,
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          lineHeight: 1.65,
          resize: 'vertical',
          outline: 'none',
          transition: 'border-color 0.2s',
        }}
        onFocus={e => { e.target.style.borderColor = styles.dot; e.target.style.color = styles.notesText }}
        onBlur={e => e.target.style.borderColor = styles.accent}
      />
      {!scheduleId && (
        <p style={{ fontSize: 11, color: styles.notesPlaceholder, marginTop: 5, fontStyle: 'italic' }}>
          Save the schedule to enable note persistence.
        </p>
      )}
    </div>
  )
}
