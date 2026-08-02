export interface Option {
  label: string
  points?: number
  interpretation: string
}

export interface Question {
  part: 1 | 2 | 3
  question: string
  scored: boolean
  options: Option[]
}

export interface Profile {
  key: string
  min: number
  max: number
  label: string
  emoji: string
  identite: string
  objectifs: string[]
  horizon: string
  tolerance: string
  comportement: string[]
  produits: string[]
  vigilance: string[]
}

export const QUESTIONS: Question[] = [
  {
    part: 1,
    question: 'Quelle est votre situation matrimoniale ?',
    scored: false,
    options: [
      { label: 'Célibataire sans enfants', interpretation: 'Pas de charge familiale immédiate — vous avez plus de flexibilité pour prendre du risque.' },
      { label: 'Célibataire avec enfants', interpretation: "Avec des enfants à charge, pensez à sécuriser une poche dédiée à leur éducation." },
      { label: 'Marié(e) sans enfants', interpretation: 'En couple sans enfants — possibilité de mutualiser l\'effort d\'épargne.' },
      { label: 'Marié(e) avec enfants', interpretation: 'Famille avec enfants — prévoyez une poche réservée aux études et aux imprévus familiaux.' },
    ],
  },
  {
    part: 1,
    question: 'Prévoyez-vous retirer des sommes dans les 5 prochaines années ?',
    scored: true,
    options: [
      { label: 'Retraits réguliers', points: 1, interpretation: 'Des retraits réguliers signifient qu\'une partie de votre épargne doit rester liquide et peu volatile.' },
      { label: 'Retraits ponctuels', points: 2, interpretation: 'Des retraits ponctuels à prévoir — gardez une poche de liquidité disponible à tout moment.' },
      { label: 'Retrait prévu mais faible', points: 3, interpretation: "Un retrait limité laisse une large place à l'investissement de long terme." },
      { label: 'Aucun retrait prévu', points: 4, interpretation: 'Aucun retrait prévu à 5 ans — vous pouvez investir sur un horizon long sans contrainte de liquidité.' },
    ],
  },
  {
    part: 1,
    question: 'Quand prévoyez-vous récupérer au moins un tiers de votre investissement ?',
    scored: true,
    options: [
      { label: 'Moins de 5 ans', points: 1, interpretation: 'Récupération sous 5 ans : privilégiez des actifs peu volatils, le temps de récupération ne pardonne pas une chute mal placée.' },
      { label: '5–9 ans', points: 2, interpretation: 'Horizon de 5 à 9 ans : une exposition modérée aux actions BRVM est compatible avec ce délai.' },
      { label: '10–14 ans', points: 3, interpretation: 'Horizon de 10 à 14 ans : large place pour les actions de croissance, plusieurs cycles boursiers sont devant vous.' },
      { label: '≥ 15 ans', points: 4, interpretation: 'Horizon de 15 ans ou plus : vous pouvez traverser plusieurs cycles haussiers et baissiers sans que cela affecte votre stratégie.' },
    ],
  },
  {
    part: 1,
    question: 'Quel est votre objectif principal ?',
    scored: true,
    options: [
      { label: 'Protection du capital', points: 1, interpretation: 'La protection du capital est votre priorité : obligations d\'État UEMOA et fonds monétaires doivent dominer.' },
      { label: 'Liquidités rapides', points: 1, interpretation: 'Besoin de liquidités rapides : conservez une poche disponible sur compte à terme ou Mobile Money rémunéré.' },
      { label: 'Revenu (dividendes, coupons)', points: 2, interpretation: 'Recherche de revenus réguliers : les valeurs à dividendes de la BRVM comme SONATEL ou SIB correspondent bien à cet objectif.' },
      { label: 'Revenu + croissance', points: 3, interpretation: 'Équilibre entre revenu et croissance : un portefeuille mixte actions / obligations est indiqué.' },
      { label: 'Croissance long-terme', points: 3, interpretation: "Croissance long terme visée : l'accumulation régulière d'actions de qualité sur plusieurs années est la voie logique." },
      { label: 'Rendement élevé / spéculation', points: 4, interpretation: 'Recherche de rendement élevé : vous acceptez la spéculation sur des valeurs BRVM à fort potentiel mais plus volatiles.' },
    ],
  },
  {
    part: 2,
    question: 'Niveau de connaissance financière',
    scored: true,
    options: [
      { label: 'Limitée', points: 1, interpretation: 'Connaissance limitée : privilégiez des produits simples (OPCVM, obligations) et un accompagnement renforcé.' },
      { label: 'Correcte', points: 2, interpretation: "Connaissance correcte : vous comprenez les bases d'un portefeuille diversifié actions / obligations." },
      { label: 'Bonne', points: 3, interpretation: 'Bonne connaissance : vous pouvez gérer vous-même une allocation actions / obligations et suivre vos positions.' },
      { label: 'Très bonne', points: 4, interpretation: 'Très bonne connaissance : vous pouvez exploiter des stratégies avancées (analyse technique, multi-timeframe).' },
    ],
  },
  {
    part: 2,
    question: 'Situation financière actuelle',
    scored: true,
    options: [
      { label: 'Endettée', points: 1, interpretation: "Situation endettée : la priorité est le désendettement avant toute prise de risque supplémentaire." },
      { label: 'Fragile', points: 1, interpretation: "Situation fragile : constituez d'abord une épargne de précaution avant d'augmenter le risque du portefeuille." },
      { label: 'Équilibrée', points: 2, interpretation: 'Situation équilibrée : vous avez une bonne base pour investir régulièrement et de façon disciplinée.' },
      { label: 'Excédentaire', points: 3, interpretation: 'Situation excédentaire : vous avez la capacité d\'investir des montants plus importants et de prendre plus de risque.' },
    ],
  },
  {
    part: 2,
    question: 'Événements possibles pouvant affecter votre capacité à investir',
    scored: false,
    options: [
      { label: 'Retraite', interpretation: "La retraite approche : renforcez progressivement la part obligataire à mesure que l'horizon se raccourcit." },
      { label: "Perte d'emploi", interpretation: "Risque de perte d'emploi identifié : gardez 3 à 6 mois de charges en épargne de précaution avant d'investir agressivement." },
      { label: 'Revenus instables', interpretation: 'Revenus instables : privilégiez la flexibilité et évitez les engagements rigides sur le long terme.' },
      { label: 'Santé / invalidité prolongée', interpretation: "Risque santé identifié : assurez-vous d'avoir une couverture adéquate avant de prendre plus de risque." },
      { label: "Naissance d'un enfant / Mariage", interpretation: 'Changement familial à venir : anticipez les besoins de liquidité à court terme liés à cet événement.' },
      { label: 'Aucune situation', interpretation: 'Aucun événement majeur anticipé : vous pouvez maintenir votre allocation actuelle sans ajustement particulier.' },
    ],
  },
  {
    part: 2,
    question: 'Pour atteindre vos objectifs, votre portefeuille doit',
    scored: true,
    options: [
      { label: 'Être stable', points: 1, interpretation: 'Portefeuille stable recherché : faible part d\'actions, forte part obligataire et monétaire.' },
      { label: 'Préserver la valeur', points: 1, interpretation: 'Préservation de la valeur : allocation prudente avec quelques actions défensives (télécoms, banques solides).' },
      { label: 'Accepter des variations modérées', points: 2, interpretation: "Variations modérées acceptées : une allocation équilibrée autour de 40 à 60% d'actions est cohérente." },
      { label: 'Supporter des fluctuations importantes', points: 3, interpretation: 'Fluctuations importantes supportées : une forte allocation actions, y compris des valeurs de croissance, est envisageable.' },
    ],
  },
  {
    part: 3,
    question: 'En cas de baisse sur la BRVM, combien de temps acceptez-vous d\'attendre ?',
    scored: true,
    options: [
      { label: 'Moins de 3 mois', points: 1, interpretation: 'Tolérance de 3 mois maximum : votre horizon de décision est court, la prudence doit dominer votre allocation.' },
      { label: '3–6 mois', points: 2, interpretation: 'Tolérance de 3 à 6 mois : profil prudent à modéré, vous supportez une correction mais pas une crise prolongée.' },
      { label: '6–12 mois', points: 2, interpretation: 'Tolérance de 6 à 12 mois : profil modéré, vous pouvez encaisser un cycle baissier de taille moyenne.' },
      { label: '1–3 ans', points: 3, interpretation: 'Tolérance de 1 à 3 ans : profil dynamique, vous pouvez traverser un cycle baissier complet sans paniquer.' },
      { label: 'Plus de 3 ans', points: 4, interpretation: 'Tolérance de plus de 3 ans : profil très dynamique, votre vision long terme est pleinement assumée.' },
    ],
  },
  {
    part: 3,
    question: 'Perte acceptable sur un portefeuille de 5 000 000 FCFA',
    scored: true,
    options: [
      { label: '10%', points: 1, interpretation: 'Une perte de 500 000 FCFA serait votre limite : la tolérance au risque est limitée, privilégiez la prudence.' },
      { label: '20%', points: 2, interpretation: 'Une perte de 1 000 000 FCFA serait acceptable : tolérance modérée, compatible avec un portefeuille équilibré.' },
      { label: '30%', points: 3, interpretation: 'Une perte de 1 500 000 FCFA serait acceptable : tolérance élevée, un portefeuille majoritairement actions est cohérent.' },
      { label: '> 30%', points: 4, interpretation: 'Une perte de plus de 1 500 000 FCFA serait acceptable : tolérance très élevée, profil agressif assumé.' },
    ],
  },
  {
    part: 3,
    question: 'Réaction à une chute de 50% des marchés',
    scored: true,
    options: [
      { label: 'Tout vendre', points: 1, interpretation: 'Vendre l\'intégralité en cas de chute de 50% révèle une tolérance émotionnelle faible — un point de vigilance important à connaître sur vous-même.' },
      { label: 'Vendre une partie', points: 2, interpretation: 'Réduire partiellement vos positions est une réaction prudente mais réactive — limite le risque sans paniquer totalement.' },
      { label: 'Garder', points: 3, interpretation: 'Garder vos positions en cas de chute de 50% démontre une bonne discipline, typique d\'un profil modéré à dynamique.' },
      { label: 'Acheter plus', points: 4, interpretation: 'Acheter davantage pendant une chute de 50% est une posture contrarian, typique d\'un profil très dynamique et expérimenté.' },
    ],
  },
  {
    part: 3,
    question: 'Quel portefeuille vous convient ?',
    scored: true,
    options: [
      { label: 'Très sécuritaire', points: 1, interpretation: 'Un portefeuille très sécuritaire correspond à une allocation quasi totalement obligataire et monétaire.' },
      { label: 'Sécuritaire avec légères fluctuations', points: 2, interpretation: 'Un portefeuille sécuritaire avec légères fluctuations correspond à environ 80% obligataire pour 20% actions.' },
      { label: 'Modéré', points: 3, interpretation: 'Un portefeuille modéré correspond à un équilibre proche de 50% actions / 50% obligations.' },
      { label: 'Dynamique', points: 4, interpretation: "Un portefeuille dynamique correspond à une majorité d'actions, autour de 70 à 80% de l'allocation totale." },
      { label: 'Très agressif', points: 5, interpretation: "Un portefeuille très agressif correspond à une allocation quasi exclusivement en actions, y compris des valeurs spéculatives." },
    ],
  },
]

export const PART_TITLES: Record<number, string> = {
  1: "PARTIE 1 : STRUCTURE DU PROJET D'INVESTISSEMENT",
  2: 'PARTIE 2 : SITUATION FINANCIÈRE ET CAPACITÉ D\'INVESTISSEMENT',
  3: 'PARTIE 3 : COMPORTEMENT FACE AU RISQUE',
}

export const PROFILES: Profile[] = [
  {
    key: 'securitaire', min: 10, max: 15, label: 'Sécuritaire (Le Gardien)', emoji: '🔵',
    identite: "Le Sécuritaire place la préservation du capital au-dessus de tout. Toute perte, même temporaire, est vécue comme un échec. La performance est secondaire face à la certitude de retrouver son capital intact.",
    objectifs: ['Préserver intégralement le capital investi', 'Disposer de liquidités à tout moment', 'Éviter toute exposition aux marchés actions'],
    horizon: '0 à 2 ans',
    tolerance: "Quasi nulle → N'accepte aucune baisse significative, même temporaire (0 à 5%).",
    comportement: ['Vit très mal la moindre baisse, même passagère', 'Privilégie systématiquement la disponibilité immédiate des fonds', 'Convient aux personnes proches de la retraite ou sans coussin de sécurité'],
    produits: ['Bons du Trésor BRVM courte échéance', 'Comptes à terme Mobile Money (Wave, Orange Money, MTN)', 'OPCVM monétaires'],
    vigilance: ["L'inflation érode le pouvoir d'achat plus vite que ces placements ne rapportent", 'Aucune protection contre la hausse du coût de la vie sur le long terme'],
  },
  {
    key: 'prudent', min: 16, max: 21, label: 'Prudent (Le Protecteur)', emoji: '🟢',
    identite: "Le Prudent accepte de petites fluctuations pour améliorer légèrement son rendement, mais la sécurité reste la priorité. Il privilégie des placements peu volatils avec une touche d'exposition aux marchés.",
    objectifs: ["Protéger le capital tout en battant légèrement l'inflation", 'Générer un revenu stable et prévisible', 'Limiter au maximum les surprises négatives'],
    horizon: '2 à 5 ans',
    tolerance: 'Faible → Accepte des baisses temporaires de 5 à 12%.',
    comportement: ['Réagit avec inquiétude en cas de baisse mais ne panique pas immédiatement', 'Préfère la régularité à la performance ponctuelle', 'Profil très répandu chez les épargnants traditionnels ivoiriens'],
    produits: ["Obligations d'État UEMOA", 'Bons du Trésor BRVM', 'OPCVM obligataires', 'Quelques actions défensives à dividendes (SONATEL, SIB)'],
    vigilance: ["Rendement parfois proche de l'inflation, marge de progression limitée", 'Une allocation trop prudente peut freiner la constitution de patrimoine sur le long terme'],
  },
  {
    key: 'equilibre', min: 22, max: 27, label: "Modéré (L'Équilibré)", emoji: '🟡',
    identite: "L'Équilibré recherche un compromis réel entre rendement et sécurité. Il est prêt à accepter des fluctuations modérées de son portefeuille pour bénéficier de la croissance des marchés sur le moyen terme.",
    objectifs: ['Faire croître son capital de façon progressive et régulière', 'Conserver une part sécurisée du patrimoine', 'Diversifier intelligemment entre actions et obligations'],
    horizon: '5 à 10 ans',
    tolerance: 'Moyenne → Accepte des baisses temporaires de 12 à 22%.',
    comportement: ['Réagit généralement avec calme face aux corrections normales', 'Accepte la volatilité tant qu\'elle reste dans des limites raisonnables', 'Très adapté aux profils "classe moyenne stable" ivoiriens'],
    produits: ['Actions stables : SONATEL, SIB, NSIA BANQUE CI, ECOBANK CI', 'OPCVM diversifiés / mixtes', 'Obligations UEMOA en complément'],
    vigilance: ["Peut sous-estimer l'ampleur d'une vraie crise de marché", 'Risque d\'hésiter à investir davantage en période de baisse, ce qui nuit à la stratégie long terme'],
  },
  {
    key: 'dynamique', min: 28, max: 33, label: "Dynamique (L'Ambitieux)", emoji: '🟠',
    identite: 'Le Dynamique recherche une croissance significative de son capital et comprend que la volatilité est le prix à payer pour des rendements supérieurs. Il reste investi malgré les turbulences et garde une vision long terme.',
    objectifs: ['Maximiser la croissance du capital sur le long terme', 'Profiter pleinement des cycles haussiers de la BRVM', "Construire un patrimoine ambitieux par l'investissement régulier"],
    horizon: '10 à 15 ans',
    tolerance: 'Élevée → Accepte des baisses temporaires de 22 à 35%.',
    comportement: ['Voit les baisses comme des opportunités de renforcement', 'Tolère bien la volatilité à court et moyen terme', 'Profil adapté aux jeunes actifs et entrepreneurs avec horizon long'],
    produits: ['Actions de croissance : BOA CI, ORAGROUP, CORIS BANK, BERNABE', 'Petites et moyennes capitalisations BRVM à fort potentiel', 'Une part résiduelle d\'obligations pour amortir les chocs'],
    vigilance: ['Risque de décisions émotionnelles en cas de panique généralisée du marché', 'Nécessite un suivi régulier et une vraie discipline d\'investissement'],
  },
  {
    key: 'agressif', min: 34, max: 39, label: 'Agressif (Le Conquérant)', emoji: '🔴',
    identite: "L'Agressif vise la performance maximale et accepte des fluctuations très importantes, y compris des pertes temporaires sévères, en échange d'un potentiel de gain élevé. Il a une vision long terme et une grande maîtrise émotionnelle face aux marchés.",
    objectifs: ['Maximiser le rendement, quitte à accepter une forte volatilité', 'Concentrer le portefeuille sur les meilleures opportunités identifiées', "Exploiter activement les cycles de marché, y compris via le trading actif"],
    horizon: '15 ans et plus, avec une gestion active possible',
    tolerance: 'Très élevée → Accepte des baisses temporaires de 35% ou plus, sans remettre en cause la stratégie.',
    comportement: ["Considère les fortes baisses comme des opportunités d'achat majeures", 'Gère activement son portefeuille, y compris via l\'analyse technique multi-actifs', 'Profil rare, adapté aux investisseurs expérimentés avec capacité financière solide'],
    produits: ['Portefeuille concentré sur valeurs BRVM à fort potentiel (small caps)', 'Trading actif sur Forex et indices synthétiques (Deriv)', 'Stratégies algorithmiques et multi-timeframe (EA, analyse technique avancée)'],
    vigilance: ["Risque de ruine en cas de levier excessif ou d'absence de gestion du risque", 'Exige une discipline stricte (stop-loss, taille de position) pour éviter les pertes catastrophiques'],
  },
]

export type Answers = Record<number, number>

export function calculateScore(answers: Answers): number {
  let total = 0
  QUESTIONS.forEach((q, i) => {
    if (q.scored && answers[i] !== undefined) {
      total += q.options[answers[i]].points ?? 0
    }
  })
  return total
}

export function getProfile(score: number): Profile {
  return PROFILES.find((p) => score >= p.min && score <= p.max) || PROFILES[2]
}

export function getPercentage(score: number): number {
  const MIN = 10, MAX = 39
  return Math.round(((score - MIN) / (MAX - MIN)) * 100)
}

export const PROFILE_COLORS: Record<string, string> = {
  securitaire: '#3B82F6',
  prudent: '#22C55E',
  equilibre: '#EAB308',
  dynamique: '#F97316',
  agressif: '#EF4444',
}
