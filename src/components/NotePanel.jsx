// src/components/NotePanel.jsx
import { useState, useEffect, useRef } from 'react'
import { saveNote } from '../lib/supabase'

function newItem(text = '') {
  return { id: Date.now() + Math.random(), text, checked: false }
}

function parseContent(raw) {
  if (!raw) return [newItem()]
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch (_) {}
  // Legacy plain-text notes — migrate into a single unchecked item
  return raw.trim() ? [{ id: Date.now(), text: raw.trim(), checked: false }] : [newItem()]
}

function serializeItems(items) {
  return JSON.stringify(items)
}

export default function NotePanel({ blockId, scheduleId, initialContent = '', styles, onSave }) {
  const [items, setItems] = useState(() => parseContent(initialContent))
  const [status, setStatus] = useState('idle') // idle | saving | saved | error
  const timer = useRef(null)
  const inputRefs = useRef({})

  // Re-sync if initialContent changes (e.g. opening a different block)
  useEffect(() => {
    setItems(parseContent(initialContent))
  }, [initialContent, blockId])

  function persist(nextItems) {
    setStatus('idle')
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      if (!scheduleId) return
      setStatus('saving')
      try {
        await saveNote(scheduleId, blockId, serializeItems(nextItems))
        onSave?.(serializeItems(nextItems))
        setStatus('saved')
        setTimeout(() => setStatus('idle'), 2000)
      } catch {
        setStatus('error')
      }
    }, 600)
  }

  function updateItem(id, text) {
    const next = items.map(it => it.id === id ? { ...it, text } : it)
    setItems(next)
    persist(next)
  }

  function toggleItem(id) {
    const next = items.map(it => it.id === id ? { ...it, checked: !it.checked } : it)
    setItems(next)
    persist(next)
  }

  function addItem(afterId) {
    const idx = items.findIndex(it => it.id === afterId)
    const fresh = newItem()
    const next = [...items.slice(0, idx + 1), fresh, ...items.slice(idx + 1)]
    setItems(next)
    persist(next)
    // Focus the new input after render
    setTimeout(() => inputRefs.current[fresh.id]?.focus(), 30)
  }

  function removeItem(id) {
    if (items.length === 1) {
      // Don't remove last item — just clear it
      const next = [{ ...items[0], text: '' }]
      setItems(next)
      persist(next)
      return
    }
    const idx = items.findIndex(it => it.id === id)
    const next = items.filter(it => it.id !== id)
    setItems(next)
    persist(next)
    // Focus previous item
    const focusIdx = Math.max(0, idx - 1)
    setTimeout(() => {
      const prevId = next[focusIdx]?.id
      if (prevId) inputRefs.current[prevId]?.focus()
    }, 30)
  }

  function handleKeyDown(e, id) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem(id)
    } else if (e.key === 'Backspace') {
      const item = items.find(it => it.id === id)
      if (item?.text === '') {
        e.preventDefault()
        removeItem(id)
      }
    }
  }

  const statusLabel = { saving: 'saving…', saved: '✓ saved', error: '✗ error', idle: '' }[status]
  const statusColor = { saving: styles.notesPlaceholder, saved: styles.tagText, error: '#E05050', idle: '' }[status]

  const unchecked = items.filter(it => !it.checked)
  const checked = items.filter(it => it.checked)

  return (
    <div style={{ marginTop: 14, borderTop: `1px solid ${styles.accent}`, paddingTop: 12 }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontSize: 10, letterSpacing: '0.13em', textTransform: 'uppercase',
          opacity: 0.5, fontFamily: "'DM Mono', monospace", color: styles.text,
        }}>
          Checklist
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {statusLabel && (
            <span style={{ fontSize: 10, color: statusColor, fontFamily: "'DM Mono', monospace", transition: 'color 0.3s' }}>
              {statusLabel}
            </span>
          )}
          <button
            onClick={() => { const fresh = newItem(); const next = [...items, fresh]; setItems(next); persist(next); setTimeout(() => inputRefs.current[fresh.id]?.focus(), 30) }}
            style={{
              background: 'transparent', border: `1px solid ${styles.btnBorder}`,
              borderRadius: 5, padding: '2px 8px', cursor: 'pointer',
              color: styles.tagText, fontSize: 14, lineHeight: 1,
              fontFamily: "'DM Mono', monospace",
            }}
            title="Add item"
          >
            +
          </button>
        </div>
      </div>

      {/* Unchecked items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {unchecked.map(item => (
          <ChecklistRow
            key={item.id}
            item={item}
            styles={styles}
            inputRef={el => inputRefs.current[item.id] = el}
            onToggle={() => toggleItem(item.id)}
            onUpdate={text => updateItem(item.id, text)}
            onKeyDown={e => handleKeyDown(e, item.id)}
          />
        ))}
      </div>

      {/* Checked items — collapsed section */}
      {checked.length > 0 && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px dashed ${styles.accent}` }}>
          <div style={{
            fontSize: 9.5, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: styles.tagText, opacity: 0.5, fontFamily: "'DM Mono', monospace",
            marginBottom: 5,
          }}>
            Done ({checked.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {checked.map(item => (
              <ChecklistRow
                key={item.id}
                item={item}
                styles={styles}
                inputRef={el => inputRefs.current[item.id] = el}
                onToggle={() => toggleItem(item.id)}
                onUpdate={text => updateItem(item.id, text)}
                onKeyDown={e => handleKeyDown(e, item.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!scheduleId && (
        <p style={{ fontSize: 11, color: styles.notesPlaceholder, marginTop: 8, fontStyle: 'italic' }}>
          Save the schedule to enable checklist persistence.
        </p>
      )}
    </div>
  )
}

function ChecklistRow({ item, styles, inputRef, onToggle, onUpdate, onKeyDown }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Custom checkbox */}
      <button
        onClick={onToggle}
        style={{
          flexShrink: 0,
          width: 16, height: 16, borderRadius: 4,
          border: `1.5px solid ${item.checked ? styles.dot : styles.btnBorder}`,
          background: item.checked ? styles.dot : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          padding: 0,
        }}
      >
        {item.checked && (
          <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
            <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </button>

      {/* Text input */}
      <input
        ref={inputRef}
        type="text"
        value={item.text}
        onChange={e => onUpdate(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Add item…"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: item.checked ? styles.notesPlaceholder : styles.notesText,
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 300,
          lineHeight: 1.5,
          textDecoration: item.checked ? 'line-through' : 'none',
          transition: 'color 0.2s',
        }}
      />
    </div>
  )
}
