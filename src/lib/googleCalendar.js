// src/lib/googleCalendar.js
// Google Calendar OAuth2 integration using the implicit (token) flow.
// No backend required — all browser-side.
//
// Setup (one-time):
//   1. Go to https://console.cloud.google.com
//   2. Create a project → Enable "Google Calendar API"
//   3. APIs & Services → Credentials → Create → OAuth 2.0 Client ID → Web application
//   4. Add your domain to "Authorized JavaScript origins" (http://localhost:5173 for dev, your Vercel URL for prod)
//   5. Copy the Client ID into VITE_GOOGLE_CLIENT_ID in .env.local

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly'

let _tokenClient = null
let _accessToken = null

function loadGsiScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) { resolve(); return }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(script)
  })
}

export async function connectGoogleCalendar() {
  if (!CLIENT_ID) throw new Error('VITE_GOOGLE_CLIENT_ID is not set. See src/lib/googleCalendar.js for setup instructions.')
  await loadGsiScript()

  return new Promise((resolve, reject) => {
    _tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.error) {
          reject(new Error(response.error_description || response.error))
          return
        }
        _accessToken = response.access_token
        resolve(response.access_token)
      },
    })
    _tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function isConnected() {
  return !!_accessToken
}

export function disconnect() {
  if (_accessToken && window.google?.accounts?.oauth2) {
    window.google.accounts.oauth2.revoke(_accessToken)
  }
  _accessToken = null
}

// Fetch today's events from primary calendar
export async function fetchTodayEvents(token) {
  const t = token || _accessToken
  if (!t) throw new Error('Not connected to Google Calendar')

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

  const params = new URLSearchParams({
    timeMin: startOfDay.toISOString(),
    timeMax: endOfDay.toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${t}` },
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message || 'Failed to fetch calendar events')
  }

  const data = await res.json()
  return (data.items || []).filter(e => e.status !== 'cancelled')
}

// Format events into a readable string for the AI prompt
export function formatEventsForPrompt(events) {
  if (!events || events.length === 0) return ''

  const lines = events.map(event => {
    const title = event.summary || 'Untitled event'
    const start = event.start?.dateTime || event.start?.date
    const end = event.end?.dateTime || event.end?.date

    if (event.start?.date && !event.start?.dateTime) {
      // All-day event
      return `• ${title} (all day)`
    }

    const startTime = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const endTime = new Date(end).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    const location = event.location ? ` @ ${event.location}` : ''
    return `• ${title}: ${startTime} – ${endTime}${location}`
  })

  return [
    'EXISTING GOOGLE CALENDAR EVENTS FOR TODAY (these are fixed — schedule around them and flag any conflicts):',
    ...lines,
    '',
  ].join('\n')
}
