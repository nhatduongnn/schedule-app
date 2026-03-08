// src/components/Block.jsx
import { useState, useRef } from 'react'
import { TYPE_STYLES } from '../lib/theme'
import NotePanel from './NotePanel'

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0
  const clean = timeStr.trim().toUpperCase()
  const match = clean.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/)
  if (!match) return 0
  let h = parseInt(match[1])
  const m = parseInt(match[2])
  const ampm = match[3]
  if (ampm === 'PM' && h !== 12) h += 12
  if (ampm === 'AM' && h === 12) h = 0
  return h * 60 + m
}

function minutesToTimeStr(mins) {
  const h24 = ((mins % 1440) + 1440) % 1440
  const h = Math.floor(h24 / 60)
  const m = h24 % 60
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ampm
}

function parseDurationToMinutes(durStr) {
  if (!durStr) return 60
  const upper = durStr.toUpperCase()
  const hrMatch = upper.match(/(\d+\.?\d*)\s*HR/)
  const minMatch = upper.match(/(\d+)\s*MIN/)
  let total = 0
  if (hrMatch) total += parseFloat(hrMatch[1]) * 60
  if (minMatch) total += parseInt(minMatch[1])
  return total || 60
}

function minutesToDurationStr(mins) {
  if (mins < 60) return mins + ' MIN'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return h + ' HR'
  return h + 'H ' + m + 'M'
}

export default function Block({
  block, index, scheduleId, initialNote,
  editMode, isDragging,
  onDurationChange, done, onToggleDone,
  onDragStart, onDragEnd,
}) {
  const [open, setOpen] = useState(false)
  const [editingDuration, setEditingDuration] = useState(false)
  const [durationInput, setDurationInput] = useState('')
  const s = TYPE_STYLES[block.type] || TYPE_STYLES.rest

  // Double tap logic
  const lastTap = useRef(0)
  function handleDoubleTap(e) {
    if (editMode) return
    const now = Date.now()
    if (now - lastTap.current < 350) {
      onToggleDone?.()
    }
    lastTap.current = now
  }

  function startEditDuration() {
    setDurationInput(String(parseDurationToMinutes(block.duration)))
    setEditingDuration(true)
  }

  function commitDuration() {
    const mins = parseInt(durationInput)
    if (!isNaN(mins) && mins > 0) {
      onDurationChange?.(mins)
    }
    setEditingDuration(false)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '76px 1fr',
        gap: '0 18px',
        opacity: isDragging ? 0.5 : (done ? 0.72 : 1),
        animation: isDragging ? 'none' : `fadeUp 0.5s ${0.04 + index * 0.065}s ease forwards`,
        transition: 'opacity 0.3s',
      }}
      onClick={handleDoubleTap}
    >
      {/* Time column */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 22 }}>
        <span style={{
          fontFamily: "'DM Mono', monospace", fontSize: 11,
          color: done ? '#C0B0A0' : '#B0A090', letterSpacing: '0.04em', whiteSpace: 'nowrap',
          textDecoration: done ? 'line-through' : 'none',
        }}>
          {block.time}
        </span>
        <div style={{ flex: 1, width: 1, background: '#E0D8CC', margin: '8px 5px 0 auto' }} />
      </div>

      {/* Card */}
      <div
        style={{
          margin: '8px 0 10px',
          borderRadius: 14,
          padding: '16px 20px',
          background: s.card,
          color: s.text,
          border: `1.5px solid ${s.accent}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'default',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
        }}
        onMouseEnter={e => {
          if (!done && !editMode) {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(59,42,26,0.12)'
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = ''
          e.currentTarget.style.boxShadow = ''
        }}
      >
        {/* Done overlay — diagonal stripes */}
        {done && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 13,
            background: 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(0,0,0,0.06) 8px, rgba(0,0,0,0.06) 16px)',
            pointerEvents: 'none', zIndex: 1,
          }} />
        )}
        {done && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 13,
            background: 'rgba(0,0,0,0.18)',
            pointerEvents: 'none', zIndex: 1,
          }} />
        )}

        {/* Done checkmark badge */}
        {done && (
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 3,
            width: 22, height: 22, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, color: 'rgba(255,255,255,0.9)',
          }}>
            ✓
          </div>
        )}

        {/* Edit mode drag handle — ONLY this element is draggable */}
        {editMode && (
          <div
            draggable
            onDragStart={e => { e.stopPropagation(); onDragStart?.() }}
            onDragEnd={e => { e.stopPropagation(); onDragEnd?.() }}
            style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              zIndex: 4, cursor: 'grab', padding: '8px 4px',
              display: 'flex', flexDirection: 'column', gap: 3,
            }}
            title="Drag to reorder"
          >
            {[0,1,2].map(row => (
              <div key={row} style={{ display: 'flex', gap: 3 }}>
                {[0,1].map(col => (
                  <div key={col} style={{
                    width: 3, height: 3, borderRadius: '50%',
                    background: s.pillText, opacity: 0.5,
                  }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6,
          flexWrap: 'wrap',
          paddingLeft: editMode ? 20 : 0,
          position: 'relative', zIndex: 2,
          opacity: done ? 0.6 : 1,
        }}>
          <span style={{ fontSize: 16 }}>{block.icon}</span>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: 15.5, fontWeight: 700, flex: 1,
            textDecoration: done ? 'line-through' : 'none',
            minWidth: 120,
          }}>
            {block.title}
          </span>

          {/* Duration pill — tappable in edit mode */}
          {editMode && editingDuration ? (
            <input
              autoFocus
              type="number"
              value={durationInput}
              onChange={e => setDurationInput(e.target.value)}
              onBlur={commitDuration}
              onKeyDown={e => e.key === 'Enter' && commitDuration()}
              onClick={e => e.stopPropagation()}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                width: 64, padding: '3px 8px', borderRadius: 20,
                border: `1px solid ${s.dot}`,
                background: s.pillBg, color: s.pillText,
                outline: 'none', textAlign: 'center',
              }}
              placeholder="mins"
            />
          ) : (
            <span
              onClick={e => { e.stopPropagation(); if (editMode) startEditDuration() }}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 10,
                padding: '3px 10px', borderRadius: 20, letterSpacing: '0.06em',
                background: s.pillBg, color: s.pillText, whiteSpace: 'nowrap',
                cursor: editMode ? 'pointer' : 'default',
                border: editMode ? `1px dashed ${s.dot}` : 'none',
                transition: 'border 0.15s',
              }}
              title={editMode ? 'Tap to edit duration (in minutes)' : ''}
            >
              {block.duration}
            </span>
          )}
        </div>

        {/* Description */}
        <p style={{
          fontSize: 13, lineHeight: 1.55, opacity: done ? 0.4 : 0.72,
          fontWeight: 300, color: s.text, marginBottom: 10,
          position: 'relative', zIndex: 2,
          paddingLeft: editMode ? 20 : 0,
        }}>
          {block.desc}
        </p>

        {/* Tags */}
        {!done && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12,
            position: 'relative', zIndex: 2,
            paddingLeft: editMode ? 20 : 0,
          }}>
            {(block.tags || []).map(tag => (
              <span key={tag} style={{
                fontFamily: "'DM Mono', monospace", fontSize: 9.5,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '3px 9px', borderRadius: 4,
                background: s.tag, color: s.tagText,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Notes toggle — hidden in edit mode or done */}
        {!editMode && !done && (
          <div style={{ position: 'relative', zIndex: 2 }}>
            <button
              onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: s.notesBg, border: `1px solid ${s.btnBorder}`,
                borderRadius: 7, padding: '6px 12px',
                cursor: 'pointer', color: s.tagText,
                fontSize: 12, fontFamily: "'DM Mono', monospace",
                letterSpacing: '0.06em', transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              <span style={{ fontSize: 10 }}>{open ? '▾' : '▸'}</span>
              <span>{open ? 'Hide notes' : 'Add / view notes'}</span>
            </button>
            {open && (
              <NotePanel
                blockId={block.id}
                scheduleId={scheduleId}
                initialContent={initialNote}
                styles={s}
              />
            )}
          </div>
        )}

        {/* Double tap hint */}
        {!editMode && !done && (
          <div style={{
            position: 'absolute', bottom: 8, right: 12, zIndex: 2,
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            color: s.pillText, opacity: 0.25, letterSpacing: '0.06em',
          }}>
            double tap to complete
          </div>
        )}
        {!editMode && done && (
          <div style={{
            position: 'absolute', bottom: 8, right: 12, zIndex: 3,
            fontFamily: "'DM Mono', monospace", fontSize: 9,
            color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em',
          }}>
            double tap to undo
          </div>
        )}
      </div>
    </div>
  )
}
