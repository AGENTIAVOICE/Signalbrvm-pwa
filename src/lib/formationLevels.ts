export interface FormationLevel {
  level: 1 | 2 | 3
  tag: string
  title: string
  meta: string
  price: number
  bullets: string[]
  footer: string
  color: string
  highlighted?: boolean
}

export const FORMATION_LEVELS: FormationLevel[] = [
  {
    level: 1,
    tag: 'NIVEAU 1 : DÉBUTANT',
    title: 'Initiation à la Bourse & à la BRVM',
    meta: '4 heures • En ligne ou présentiel',
    price: 20000,
    color: '#3B82F6',
    bullets: [
      'Comprendre pourquoi investir à la bourse.',
      "L'organisation du marché financier",
      'Passer votre premier ordre d\u2019achat / vente en toute sécurité.',
    ],
    footer: 'Idéale pour débuter sereinement.',
  },
  {
    level: 2,
    tag: 'NIVEAU 2 : INTERMÉDIAIRE',
    title: 'Analyser et choisir ses actions',
    meta: '4 heures • Études de cas réels',
    price: 25000,
    color: '#8B5CF6',
    bullets: [
      'Quand acheter une action ?',
      'Quand toucher ces bénéfices ?',
      "Analyse des résultats d'une entreprise.",
    ],
    footer: 'Pour structurer vos décisions.',
  },
  {
    level: 3,
    tag: 'NIVEAU 3 : AVANCÉ • LE PLUS SUIVI',
    title: "Stratégies d'investissement en Bourse",
    meta: '4 heures • Mise en pratique intensive',
    price: 30000,
    color: '#F5C842',
    highlighted: true,
    bullets: [
      'Construire un portefeuille adapté à votre profil de risque.',
      'Comment gérer ces risques à la bourse.',
      'Mettre en place une stratégie moyen / long terme cohérente.',
    ],
    footer: 'Pour passer au niveau supérieur.',
  },
]

export function getLevel(level: number): FormationLevel | undefined {
  return FORMATION_LEVELS.find((l) => l.level === level)
}
