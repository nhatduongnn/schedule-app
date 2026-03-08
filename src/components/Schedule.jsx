// src/components/Schedule.jsx
import { useState, useRef } from 'react'
import { BG_PATTERN } from '../lib/theme'
import Block from './Block'
import { jsPDF } from 'jspdf'
import { deleteSchedule } from '../lib/supabase'

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

// Recalculate ALL times from scratch starting at fromIndex
// Uses the time of blocks[fromIndex] as anchor, chains durations forward
function recalcTimes(blocks, fromIndex) {
  const updated = blocks.map(b => ({ ...b }))
  for (let i = fromIndex + 1; i < updated.length; i++) {
    const prev = updated[i - 1]
    const prevMins = parseTimeToMinutes(prev.time)
    const prevDur = parseDurationToMinutes(prev.duration)
    updated[i].time = minutesToTimeStr(prevMins + prevDur)
  }
  return updated
}

// Normalize initial blocks — recompute all times from block 0 so Gemini
// inconsistencies are corrected before the schedule is ever displayed
function normalizeSchedule(blocks) {
  if (!blocks || blocks.length === 0) return blocks
  return recalcTimes(blocks, 0)
}

export default function Schedule({ date, blocks: initialBlocks, footerNote, scheduleId, notesMap = {}, onNewDay, onDelete }) {
  const [blocks, setBlocks] = useState(() => normalizeSchedule(initialBlocks || []))
  const [editMode, setEditMode] = useState(false)
  const [doneIds, setDoneIds] = useState(new Set())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Drag state
  const dragIndex = useRef(null)
  const dragOverIndex = useRef(null)

  const displayDate = date
    ? new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : 'Today'

  function toggleDone(id) {
    setDoneIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleDurationChange(index, newMins) {
    const updated = blocks.map((b, i) => i === index
      ? { ...b, duration: minutesToDurationStr(newMins) }
      : { ...b }
    )
    const recalced = recalcTimes(updated, index)
    setBlocks(recalced)
  }

  // Drag handlers
  function onDragStart(index) {
    dragIndex.current = index
  }
  function onDragEnter(index) {
    dragOverIndex.current = index
    if (dragIndex.current === null || dragIndex.current === index) return
    setBlocks(prev => {
      const updated = [...prev]
      const dragged = updated.splice(dragIndex.current, 1)[0]
      updated.splice(index, 0, dragged)
      dragIndex.current = index
      // Recalc all times from the first block after reorder
      return recalcTimes(updated, 0)
    })
  }
  function onDragEnd() {
    dragIndex.current = null
    dragOverIndex.current = null
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      if (scheduleId) await deleteSchedule(scheduleId)
      onDelete?.()
    } catch {
      alert('Could not delete schedule. Try again.')
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  function exportPDF() {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const margin = 48
    let y = margin

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(59, 42, 26)
    doc.text('Day Schedule', margin, y)
    y += 28

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)
    doc.setTextColor(140, 110, 75)
    doc.text(displayDate, margin, y)
    y += 24

    doc.setDrawColor(196, 98, 45)
    doc.setLineWidth(1.5)
    doc.line(margin, y, margin + 40, y)
    y += 20

    blocks.forEach(block => {
      if (y > 750) { doc.addPage(); y = margin }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(59, 42, 26)
      doc.text(block.time + '  ' + block.icon + ' ' + block.title, margin, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(140, 110, 75)
      doc.text('[' + block.duration + ']', 500, y, { align: 'right' })
      y += 16
      doc.setFontSize(10)
      doc.setTextColor(80, 60, 40)
      const descLines = doc.splitTextToSize(block.desc, 460)
      doc.text(descLines, margin + 10, y)
      y += descLines.length * 14
      const note = notesMap[block.id]
      if (note) {
        y += 4
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9.5)
        doc.setTextColor(100, 80, 60)
        doc.text('Notes:', margin + 10, y)
        y += 13
        const noteLines = doc.splitTextToSize(note, 450)
        doc.text(noteLines, margin + 14, y)
        y += noteLines.length * 13
      }
      y += 14
    })

    if (footerNote) {
      y += 8
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(196, 98, 45)
      const fnLines = doc.splitTextToSize('Note: ' + footerNote, 460)
      doc.text(fnLines, margin, y)
    }
    doc.save('schedule-' + (date || 'today') + '.pdf')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      backgroundImage: BG_PATTERN,
      padding: 'clamp(28px, 5vw, 52px) clamp(16px, 4vw, 28px) 72px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 44, animation: 'fadeDown 0.6s ease both' }}>
          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: '#B0A090', textTransform: 'uppercase', marginBottom: 10 }}>
            {displayDate}
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.9rem, 6vw, 3.2rem)', fontWeight: 700, color: '#3B2A1A', lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            Today's<br /><span style={{ color: '#C4622D' }}>Block Schedule</span>
          </h1>
          <div style={{ width: 48, height: 2, background: '#C4622D', margin: '16px 0 10px' }} />

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>

            {/* Edit mode toggle */}
            <button
              onClick={() => setEditMode(e => !e)}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em',
                padding: '8px 16px', borderRadius: 8,
                border: editMode ? '1.5px solid #3B2A1A' : '1.5px solid #C4A880',
                background: editMode ? '#3B2A1A' : 'transparent',
                color: editMode ? '#F5F0E8' : '#8C6E4B',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {editMode ? '✓ Done Editing' : '✎ Edit'}
            </button>

            <button
              onClick={exportPDF}
              style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #C4A880', background: 'transparent', color: '#8C6E4B', cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#3B2A1A'; e.currentTarget.style.color = '#F5F0E8'; e.currentTarget.style.borderColor = '#3B2A1A' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8C6E4B'; e.currentTarget.style.borderColor = '#C4A880' }}
            >
              ↓ Export PDF
            </button>

            {onNewDay && (
              <button
                onClick={onNewDay}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #C4622D', background: 'transparent', color: '#C4622D', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#C4622D'; e.currentTarget.style.color = '#FFF8F0' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C4622D' }}
              >
                + New Day
              </button>
            )}

            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 8,
                border: confirmDelete ? '1.5px solid #C04040' : '1.5px solid #E0D4C4',
                background: confirmDelete ? '#C04040' : 'transparent',
                color: confirmDelete ? '#FFF0F0' : '#B0A090',
                cursor: deleting ? 'default' : 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!confirmDelete) { e.currentTarget.style.borderColor = '#C04040'; e.currentTarget.style.color = '#C04040' } }}
              onMouseLeave={e => { if (!confirmDelete) { e.currentTarget.style.borderColor = '#E0D4C4'; e.currentTarget.style.color = '#B0A090' } }}
            >
              {deleting ? 'Deleting…' : confirmDelete ? 'Tap again to confirm' : '✕ Delete'}
            </button>

            {confirmDelete && !deleting && (
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', padding: '8px 16px', borderRadius: 8, border: '1.5px solid #E0D4C4', background: 'transparent', color: '#B0A090', cursor: 'pointer' }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Edit mode hint */}
          {editMode && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, background: '#EDE6DA', fontSize: 12, color: '#8C6E4B', fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em' }}>
              ⠿ Drag blocks to reorder · Tap duration pill to edit minutes · Times auto-adjust
            </div>
          )}
        </div>

        {/* Blocks */}
        <div>
          {blocks.map((block, i) => (
            <div
              key={block.id}
              onDragEnter={() => onDragEnter(i)}
              onDragOver={e => e.preventDefault()}
            >
              <Block
                block={block}
                index={i}
                scheduleId={scheduleId}
                initialNote={notesMap[block.id] || ''}
                editMode={editMode}
                isDragging={dragIndex.current === i}
                onDurationChange={(mins) => handleDurationChange(i, mins)}
                done={doneIds.has(block.id)}
                onToggleDone={() => toggleDone(block.id)}
                onDragStart={() => onDragStart(i)}
                onDragEnd={onDragEnd}
              />
            </div>
          ))}
        </div>

        {footerNote && (
          <div style={{ marginTop: 36, padding: '18px 22px', background: '#E8E0D4', borderRadius: 12, borderLeft: '3px solid #C4622D', fontSize: 13, color: '#8C6E4B', lineHeight: 1.6, animation: 'fadeUp 0.5s 0.5s ease both', opacity: 0 }}>
            <strong style={{ color: '#3B2A1A', fontWeight: 500 }}>⚡ Note: </strong>{footerNote}
          </div>
        )}
      </div>
    </div>
  )
}
