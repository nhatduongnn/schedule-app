// src/lib/theme.js

export const TYPE_STYLES = {
  work:    { card: '#3B2A1A', text: '#F5F0E8', accent: 'rgba(255,255,255,0.13)', tag: 'rgba(255,255,255,0.08)', tagText: 'rgba(255,255,255,0.55)', dot: '#C4622D', notesBg: 'rgba(255,255,255,0.06)', notesText: '#E8DDD0', notesPlaceholder: 'rgba(255,255,255,0.25)', pillBg: 'rgba(255,255,255,0.12)', pillText: 'rgba(255,255,255,0.7)', btnBorder: 'rgba(255,255,255,0.15)' },
  food:    { card: '#FFF8F0', text: '#3B2A1A', accent: '#F0E4D4', tag: '#F0E4D4', tagText: '#8C6E4B', dot: '#C4622D', notesBg: '#FDF0E4', notesText: '#5A3A1A', notesPlaceholder: '#C4A880', pillBg: '#F0E4D4', pillText: '#8C6E4B', btnBorder: '#E8D0B0' },
  transit: { card: '#E8E0D4', text: '#3B2A1A', accent: '#D4C8B8', tag: '#C8BCA8', tagText: '#5A4A3A', dot: '#8C6E4B', notesBg: '#DDD4C4', notesText: '#3B2A1A', notesPlaceholder: '#9A8870', pillBg: '#C8BCA8', pillText: '#3B2A1A', btnBorder: '#C0B09A' },
  lab:     { card: '#1A2A2A', text: '#E0EEE0', accent: 'rgba(58,122,90,0.3)', tag: 'rgba(58,122,90,0.18)', tagText: '#80CCA0', dot: '#3A7A5A', notesBg: 'rgba(58,122,90,0.1)', notesText: '#C0E8D0', notesPlaceholder: 'rgba(128,204,160,0.45)', pillBg: 'rgba(58,122,90,0.28)', pillText: '#80CCA0', btnBorder: 'rgba(58,122,90,0.3)' },
  gym:     { card: '#1C1C2E', text: '#E0E0F0', accent: 'rgba(90,90,202,0.28)', tag: 'rgba(90,90,202,0.18)', tagText: '#A0A0E8', dot: '#5A5ACA', notesBg: 'rgba(90,90,202,0.1)', notesText: '#C0C0F0', notesPlaceholder: 'rgba(160,160,232,0.45)', pillBg: 'rgba(90,90,202,0.28)', pillText: '#A0A0E8', btnBorder: 'rgba(90,90,202,0.3)' },
  clay:    { card: '#2A1810', text: '#F0E0D0', accent: 'rgba(196,98,45,0.35)', tag: 'rgba(196,98,45,0.22)', tagText: '#F0A070', dot: '#C4622D', notesBg: 'rgba(196,98,45,0.1)', notesText: '#F0C8A0', notesPlaceholder: 'rgba(240,160,112,0.45)', pillBg: 'rgba(196,98,45,0.32)', pillText: '#F0A070', btnBorder: 'rgba(196,98,45,0.35)' },
  rest:    { card: '#FDF6FF', text: '#3B2A1A', accent: '#E8D8F0', tag: '#E8D8F0', tagText: '#7050A0', dot: '#8060A0', notesBg: '#F0E4F8', notesText: '#5A3A6A', notesPlaceholder: '#B090C0', pillBg: '#E8D8F0', pillText: '#7050A0', btnBorder: '#DCC8F0' },
}

export const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: #F5F0E8;
    font-family: 'DM Sans', sans-serif;
    color: #3B2A1A;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #EDE6DA; }
  ::-webkit-scrollbar-thumb { background: #C4A880; border-radius: 3px; }

  @keyframes fadeDown {
    from { opacity: 0; transform: translateY(-14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
`

export const BG_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%238C6E4B' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
