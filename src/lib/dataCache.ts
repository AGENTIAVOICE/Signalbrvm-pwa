// Cache mémoire partagé entre tous les composants, qui survit au
// démontage/remontage d'une page (contrairement à un simple useState).
// Objectif : quand on revient sur un écran déjà visité, on affiche
// immédiatement les dernières données connues (pas d'écran de chargement),
// pendant qu'une version fraîche se charge silencieusement en arrière-plan.
// Une simple Map suffit ici : elle vit tant que l'onglet/l'appli reste
// ouvert, et se vide naturellement à un rechargement complet.
const cache = new Map<string, unknown>()

export function getCached<T>(key: string): T | undefined {
  return cache.get(key) as T | undefined
}

export function setCached<T>(key: string, value: T): void {
  cache.set(key, value)
}

// Appelé à la déconnexion : les données mises en cache sont propres à
// l'utilisateur connecté, elles ne doivent jamais rester visibles pour la
// prochaine personne sur un appareil partagé.
export function clearAllCache(): void {
  cache.clear()
}
