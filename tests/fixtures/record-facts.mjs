/**
 * The edition's facts as its record reads them, given by hand: each part's files in claim order, the number of
 * files read, and the pin's date and release.
 * @param {{ owned?: Map<string, string[]>, read?: number, date?: string | null, release?: string | null }} [held]
 */
export const recordFacts = ({ owned = new Map(), read = 0, date = null, release = null } = {}) => ({
  owned: (id) => owned.get(id) ?? [],
  read,
  date,
  release,
});
