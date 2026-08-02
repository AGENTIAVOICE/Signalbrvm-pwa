// Fonction serverless Netlify pour l'Assistant BRVM.
// Tourne côté serveur (jamais dans le navigateur) — c'est ici, et seulement
// ici, que la clé ANTHROPIC_API_KEY doit vivre, en variable d'environnement
// Netlify (Site configuration → Environment variables). Elle n'est jamais
// incluse dans le code envoyé au navigateur.

import type { Context } from '@netlify/functions'

const SYSTEM_PROMPT = `Tu es l'assistant IA de SignalBrvm, une application d'investissement sur la BRVM (Bourse Régionale des Valeurs Mobilières de l'UEMOA).

Ton rôle : répondre aux questions des utilisateurs sur la BRVM et l'investissement.

RÈGLES STRICTES :
- Réponds TOUJOURS en français très simple, comme à un débutant.
- Sois TRÈS COURT : 2 à 4 phrases maximum. Va droit au but.
- Utilise des exemples concrets et locaux si utile (FCFA, Orange CI, Sonatel…).
- Base-toi sur ton bon sens financier général concernant la BRVM, sans inventer de chiffres précis (cours, dates, montants) que tu ne connais pas avec certitude.
- Si la question n'a aucun rapport avec la BRVM, l'argent ou l'investissement, recentre gentiment l'utilisateur vers ces sujets.
- Pas de markdown gras, pas de longues listes. Reste conversationnel et chaleureux.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: { message: 'Méthode non autorisée' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(503, {
      error: {
        message:
          "Le chat IA n'est pas encore configuré : la variable d'environnement ANTHROPIC_API_KEY est manquante côté Netlify (Site configuration → Environment variables).",
        code: 'MISSING_ANTHROPIC_KEY',
      },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: { message: 'Corps de requête invalide' } })
  }

  const messages = (body as { messages?: unknown })?.messages
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 40) {
    return jsonResponse(400, { error: { message: 'Messages invalides (1 à 40 attendus)' } })
  }
  const cleanMessages: ChatMessage[] = []
  for (const m of messages) {
    if (
      typeof m !== 'object' ||
      m === null ||
      (m as ChatMessage).role !== 'user' && (m as ChatMessage).role !== 'assistant' ||
      typeof (m as ChatMessage).content !== 'string' ||
      (m as ChatMessage).content.trim().length === 0
    ) {
      return jsonResponse(400, { error: { message: 'Format de message invalide' } })
    }
    cleanMessages.push({ role: (m as ChatMessage).role, content: (m as ChatMessage).content })
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages: cleanMessages,
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => '')
      console.error('Anthropic API error:', anthropicRes.status, errText)
      return jsonResponse(502, {
        error: { message: `Erreur de l'API Anthropic (${anthropicRes.status})`, code: 'ANTHROPIC_ERROR' },
      })
    }

    const data = await anthropicRes.json()
    const reply = (data.content ?? [])
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('\n')
      .trim()

    return jsonResponse(200, { data: { reply } })
  } catch (err) {
    console.error('Erreur fonction chat-brvm:', err)
    return jsonResponse(502, { error: { message: 'Erreur lors de la génération de la réponse.', code: 'FETCH_ERROR' } })
  }
}
