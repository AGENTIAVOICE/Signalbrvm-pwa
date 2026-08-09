// Fonction serverless Netlify : rédige une courte analyse de marché à
// partir de VRAIES métriques déjà calculées côté client (cours réel,
// tendance réelle, RSI réel...). L'IA ne fait que mettre ces chiffres en
// mots — elle n'a le droit d'inventer aucun chiffre qui ne lui a pas été
// fourni. Même principe que chat-brvm.mts : la clé ANTHROPIC_API_KEY ne
// vit que côté serveur.

import type { Context } from '@netlify/functions'

const SYSTEM_PROMPT = `Tu es un analyste de marché spécialiste de la BRVM (Bourse Régionale des Valeurs Mobilières de l'UEMOA).

On te donne des métriques RÉELLES et déjà calculées sur une valeur (cours actuel, variation, tendance sur la période, RSI, secteur...). Ta tâche : rédiger une analyse courte et professionnelle en français, qui dit si la configuration ressemble plutôt à une opportunité d'achat, de vente, ou à une situation neutre — en te basant UNIQUEMENT sur les chiffres fournis.

RÈGLES STRICTES :
- 2 à 3 phrases maximum. Direct, clair, sans jargon inutile.
- N'invente JAMAIS de chiffre (prix, pourcentage, date) qui ne t'a pas été donné dans les métriques.
- Ne donne pas d'ordre d'achat/vente ferme ("achetez maintenant") — décris la configuration technique observée et sa lecture habituelle, pas un conseil personnalisé.
- Termine toujours par une phrase rappelant que ce n'est pas un conseil en investissement personnalisé.
- Pas de markdown, pas de listes, un paragraphe simple.`

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

interface Metrics {
  stockName: string
  ticker: string
  sector?: string | null
  cours: number
  dayChangePct?: number | null
  trendPct?: number | null
  rsi?: number | null
  rangeLowPct?: number | null
  rangeHighPct?: number | null
}

const CRON_SECRET = 'hVGHQiKJJOZfST1icl1kKvnqp0EPbNDpuvJ2COP8QX4'
const ALLOWED_ORIGIN = 'https://signalbrvm.com'

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: { message: 'Méthode non autorisée' } })
  }

  // Cette route fait un vrai appel IA payant à chaque requête. On l'autorise
  // pour : (1) notre propre tâche planifiée (secret partagé, jamais exposé
  // côté client), ou (2) une requête venant réellement du navigateur sur
  // notre domaine (repli en direct quand une valeur n'a pas encore
  // d'analyse en cache). Ça bloque les scripts d'appel direct externes sans
  // empêcher l'usage normal de l'appli.
  const isCron = req.headers.get('x-cron-secret') === CRON_SECRET
  const origin = req.headers.get('origin') ?? req.headers.get('referer') ?? ''
  const isFromApp = origin.startsWith(ALLOWED_ORIGIN)
  if (!isCron && !isFromApp) {
    return jsonResponse(403, { error: { message: 'Origine non autorisée', code: 'FORBIDDEN_ORIGIN' } })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return jsonResponse(503, {
      error: { message: "L'analyse IA n'est pas configurée (ANTHROPIC_API_KEY manquante).", code: 'MISSING_ANTHROPIC_KEY' },
    })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return jsonResponse(400, { error: { message: 'Corps de requête invalide' } })
  }

  const m = body as Metrics
  if (!m || typeof m.stockName !== 'string' || typeof m.ticker !== 'string' || typeof m.cours !== 'number') {
    return jsonResponse(400, { error: { message: 'Métriques invalides' } })
  }

  const lines = [
    `Valeur : ${m.stockName} (${m.ticker})`,
    m.sector ? `Secteur : ${m.sector}` : null,
    `Cours actuel : ${m.cours} FCFA`,
    m.dayChangePct != null ? `Variation du jour : ${m.dayChangePct.toFixed(2)}%` : null,
    m.trendPct != null ? `Tendance sur la période observée : ${m.trendPct.toFixed(1)}%` : null,
    m.rsi != null ? `RSI (14) : ${m.rsi.toFixed(1)}` : null,
    m.rangeLowPct != null && m.rangeHighPct != null
      ? `Position dans la fourchette récente : ${m.rangeLowPct.toFixed(0)}% du bas, ${m.rangeHighPct.toFixed(0)}% du haut`
      : null,
  ].filter(Boolean)

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
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: lines.join('\n') }],
      }),
    })

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text().catch(() => '')
      console.error('Anthropic API error:', anthropicRes.status, errText)
      return jsonResponse(502, { error: { message: `Erreur de l'API Anthropic (${anthropicRes.status})`, code: 'ANTHROPIC_ERROR' } })
    }

    const data = await anthropicRes.json()
    const analysis = (data.content ?? [])
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text)
      .join('\n')
      .trim()

    return jsonResponse(200, { data: { analysis } })
  } catch (err) {
    console.error('Erreur fonction market-analysis:', err)
    return jsonResponse(502, { error: { message: "Erreur lors de la génération de l'analyse.", code: 'FETCH_ERROR' } })
  }
}
