// api/chat.js
// Vercel serverless function — proxies Gemini and Claude API calls safely.

const GEMINI_MODELS = {
  gemini25: 'gemini-2.5-flash',
  gemini3: 'gemini-3-flash-preview',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, system, provider = 'gemini25' } = req.body

  try {
    if (provider === 'claude') {
      return await callClaude(messages, system, res)
    } else {
      const model = GEMINI_MODELS[provider] || GEMINI_MODELS.gemini25
      return await callGemini(messages, system, model, res)
    }
  } catch (err) {
    console.error('API error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function callGemini(messages, system, model, res) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set on server.' })

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: contents,
    generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
  }

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()

  if (!response.ok) {
    const msg = data.error ? data.error.message : 'Gemini API error'
    return res.status(response.status).json({ error: msg })
  }

  const text = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]
    ? data.candidates[0].content.parts[0].text
    : ''
  return res.status(200).json({ text: text })
}

async function callClaude(messages, system, res) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set on server.' })

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: system,
      messages: messages,
    }),
  })

  const data = await response.json()

  if (!response.ok) {
    return res.status(response.status).json({ error: data.error ? data.error.message : 'Claude API error' })
  }

  const text = data.content && data.content[0] ? data.content[0].text : ''
  return res.status(200).json({ text: text })
}
