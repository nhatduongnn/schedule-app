// src/lib/supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Schedules ──────────────────────────────────────────────

export async function saveSchedule(date, blocks) {
  const { data, error } = await supabase
    .from('schedules')
    .upsert({ date, blocks }, { onConflict: 'date' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getScheduleByDate(date) {
  const { data, error } = await supabase
    .from('schedules')
    .select('*')
    .eq('date', date)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getAllSchedules() {
  const { data, error } = await supabase
    .from('schedules')
    .select('id, date, created_at')
    .order('date', { ascending: false })
  if (error) throw error
  return data
}

// ── Notes ──────────────────────────────────────────────────

export async function saveNote(scheduleId, blockId, content) {
  const { data, error } = await supabase
    .from('notes')
    .upsert(
      { schedule_id: scheduleId, block_id: blockId, content, updated_at: new Date().toISOString() },
      { onConflict: 'schedule_id,block_id' }
    )
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getNotesBySchedule(scheduleId) {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('schedule_id', scheduleId)
  if (error) throw error
  // Return as { blockId: content } map for easy lookup
  return Object.fromEntries((data || []).map(n => [n.block_id, n.content]))
}

// ── Delete ─────────────────────────────────────────────────

export async function deleteSchedule(scheduleId) {
  // Notes are deleted automatically via ON DELETE CASCADE in the schema
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)
  if (error) throw error
}
