// src/App.jsx
import { useState } from 'react'
import { GLOBAL_CSS } from './lib/theme'
import { saveSchedule, getNotesBySchedule } from './lib/supabase'
import Chat from './components/Chat'
import Schedule from './components/Schedule'
import PastSchedules from './components/PastSchedules'

export default function App() {
  // view: 'chat' | 'schedule' | 'past'
  const [view, setView] = useState('chat')
  const [scheduleData, setScheduleData] = useState(null) // { blocks, footerNote, scheduleId, date, notesMap }
  const [saving, setSaving] = useState(false)

  async function handleScheduleReady(parsed) {
    const today = new Date().toISOString().split('T')[0]
    setSaving(true)
    let scheduleId = null
    try {
      const saved = await saveSchedule(today, parsed.schedule)
      scheduleId = saved.id
    } catch (err) {
      console.error('Could not save schedule to Supabase:', err)
      // Still show schedule even if save fails
    } finally {
      setSaving(false)
    }

    setScheduleData({
      blocks: parsed.schedule,
      footerNote: parsed.footerNote,
      date: today,
      scheduleId,
      notesMap: {},
    })
    setView('schedule')
  }

  function handleOpenPast(data) {
    setScheduleData({
      blocks: data.blocks,
      footerNote: null,
      date: data.date,
      scheduleId: data.id,
      notesMap: data.notesMap || {},
    })
    setView('schedule')
  }

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      {saving && (
        <div style={{
          position: 'fixed', top: 16, right: 16, zIndex: 1000,
          background: '#3B2A1A', color: '#F5F0E8',
          padding: '10px 18px', borderRadius: 10,
          fontFamily: "'DM Mono', monospace", fontSize: 12, letterSpacing: '0.06em',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'fadeDown 0.3s ease',
        }}>
          Saving schedule…
        </div>
      )}

      {/* Nav bar — shown on schedule view */}
      {view === 'schedule' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(245,240,232,0.92)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E0D4C4',
          padding: '10px clamp(16px, 4vw, 28px)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => setView('chat')}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', background: 'transparent', border: 'none', color: '#8C6E4B', cursor: 'pointer' }}
          >
            ← New Day
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setView('past')}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', background: 'transparent', border: 'none', color: '#8C6E4B', cursor: 'pointer' }}
          >
            Past Schedules →
          </button>
        </div>
      )}

      {/* Nav bar — shown on chat view */}
      {view === 'chat' && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(245,240,232,0.92)', backdropFilter: 'blur(8px)',
          borderBottom: '1px solid #E0D4C4',
          padding: '10px clamp(16px, 4vw, 28px)',
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <button
            onClick={() => setView('past')}
            style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, letterSpacing: '0.08em', background: 'transparent', border: 'none', color: '#8C6E4B', cursor: 'pointer' }}
          >
            Past Schedules →
          </button>
        </div>
      )}

      {/* Main content with top padding for nav */}
      <div style={{ paddingTop: view !== 'past' ? 48 : 0 }}>
        {view === 'chat' && <Chat onScheduleReady={handleScheduleReady} />}

        {view === 'schedule' && scheduleData && (
          <Schedule
            date={scheduleData.date}
            blocks={scheduleData.blocks}
            footerNote={scheduleData.footerNote}
            scheduleId={scheduleData.scheduleId}
            notesMap={scheduleData.notesMap}
            onNewDay={() => setView('chat')}
            onDelete={() => { setScheduleData(null); setView('chat') }}
          />
        )}

        {view === 'past' && (
          <PastSchedules
            onOpen={handleOpenPast}
            onBack={() => setView(scheduleData ? 'schedule' : 'chat')}
          />
        )}
      </div>
    </>
  )
}
