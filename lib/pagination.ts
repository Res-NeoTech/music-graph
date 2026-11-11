/**
 * Numéro de page lu dans l'URL (`?page=3`). L'URL est une saisie de
 * l'utilisateur : tout ce qui n'est pas un entier ≥ 1 donne la page 1.
 *
 * - `undefined` : pas de paramètre → page 1
 * - tableau : `?page=2&page=5` → on prend le premier
 * - "abc", "-1", "0", "2.5", "3abc" → page 1 (parseInt accepterait "3abc")
 * - nombre trop grand pour un entier sûr → page 1, sinon l'OFFSET calculé
 *   ensuite dépasserait ce que PostgreSQL accepte
 */
export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value

  if (!raw || !/^[0-9]+$/.test(raw)) return 1

  const page = Number(raw)
  return Number.isSafeInteger(page) && page >= 1 ? page : 1
}

/** Nombre de pages nécessaires pour `total` éléments (0 si aucun). */
export function pageCount(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

export type PageItem = number | "ellipsis"

/**
 * Numéros à afficher dans la pagination : la première page, la dernière, la
 * page courante et ses deux voisines, avec "ellipsis" là où des pages sont
 * sautées. Exemple : pageWindow(5, 258) → [1, "ellipsis", 4, 5, 6, "ellipsis", 258].
 *
 * La liste fait toujours 7 éléments dès qu'il y a plus de 7 pages : la barre
 * garde la même largeur et le bouton « Next » ne bouge pas d'une page à
 * l'autre.
 */
export function pageWindow(current: number, last: number): PageItem[] {
  // 7 pages ou moins : on les affiche toutes
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1)
  }

  // Près du début : 1 2 3 4 5 … 258
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "ellipsis", last]
  }

  // Près de la fin : 1 … 254 255 256 257 258
  if (current >= last - 3) {
    return [1, "ellipsis", last - 4, last - 3, last - 2, last - 1, last]
  }

  // Au milieu : 1 … 4 5 6 … 258
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", last]
}
