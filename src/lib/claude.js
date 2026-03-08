// src/lib/claude.js

export const PROVIDERS = {
  gemini25: {
    id: 'gemini25',
    label: 'Gemini 2.5 Flash',
    badge: 'Free',
    badgeColor: '#3A7A5A',
    badgeBg: 'rgba(58,122,90,0.15)',
    description: 'Google · Free tier · Stable',
    model: 'gemini-2.5-flash',
  },
  gemini3: {
    id: 'gemini3',
    label: 'Gemini 3 Flash',
    badge: 'Free',
    badgeColor: '#3A7A5A',
    badgeBg: 'rgba(58,122,90,0.15)',
    description: 'Google · Free tier · Preview',
    model: 'gemini-3-flash-preview',
  },
  claude: {
    id: 'claude',
    label: 'Claude Sonnet',
    badge: 'Paid',
    badgeColor: '#8C6E4B',
    badgeBg: 'rgba(140,110,75,0.15)',
    description: 'Anthropic · ~$0.003 per schedule',
    model: 'claude-sonnet-4-20250514',
  },
}

export const DEFAULT_PROVIDER = 'gemini25'

const SYSTEM_PROMPT = "You are a smart, friendly daily schedule builder assistant.\n\nYour job is to have a short conversation with the user to understand their day, then generate a structured schedule.\n\nCONVERSATION PHASE:\n- The user will describe their day and activities.\n- Ask 1-3 targeted clarifying questions if needed (e.g. start time, duration of activities, hard constraints).\n- Keep questions concise and friendly.\n- Once you have enough information, generate the schedule.\n\nSCHEDULE GENERATION:\nWhen you have enough info, respond with ONLY a valid JSON object. No prose, no markdown, no code fences, no backticks. Just the raw JSON object.\n\nUse this exact shape:\n{\"schedule\":[{\"id\":\"unique-kebab-id\",\"time\":\"9:00 AM\",\"title\":\"Block Title\",\"icon\":\"emoji\",\"duration\":\"2 HRS\",\"type\":\"work\",\"desc\":\"One or two sentence description.\",\"tags\":[\"Tag1\",\"Tag2\"]}],\"footerNote\":\"A short helpful note.\"}\n\nBLOCK TYPES (pick the most fitting):\n- work: deep work, focus sessions, studying\n- food: meals, coffee breaks, snacks\n- transit: commuting, walking, driving, errands\n- lab: lab work, research, experiments\n- gym: any exercise, sports, physical activity\n- clay: creative workshops, art classes, hobbies\n- rest: breaks, naps, wind-down, buffer time\n\nRULES:\n- Always include a rest or wind-down block at the end.\n- Add short buffer/transit blocks between activities when travel is implied.\n- Be realistic with timing.\n- Use appropriate emojis for icons.\n- If the user has not given a start time, ask.\n- Output ONLY raw JSON for the schedule. No explanation. No markdown. No code fences. No backticks."

export async function sendMessage(messages, provider) {
  if (!provider) provider = DEFAULT_PROVIDER
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: messages, system: SYSTEM_PROMPT, provider: provider }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to reach AI')
  }

  const data = await res.json()
  return data.text || ''
}

export function tryParseSchedule(text) {
  if (!text) return null
  var start = text.indexOf('{')
  var end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  var jsonStr = text.slice(start, end + 1)
  try {
    var parsed = JSON.parse(jsonStr)
    if (parsed && parsed.schedule) return parsed
    return null
  } catch (e) {
    return null
  }
}
