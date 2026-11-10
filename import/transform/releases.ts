import type { MbBrowseRelease } from "../musicbrainz/types"

/**
 * Types d'album importés, au format du paramètre `type` de l'API.
 * Les singles sont exclus : ils ajoutent surtout des doublons de morceaux
 * (docs/postgres/mld.md, « Points à trancher »).
 */
export const IMPORTED_RELEASE_TYPES = ["album", "ep"] as const

/**
 * Garde UNE édition (release) par album (release group). Un album a souvent
 * des dizaines d'éditions (pays, formats, rééditions) : Graduation en a 24,
 * My Beautiful Dark Twisted Fantasy 17. La table `releases` impose
 * UNIQUE (release_group_mbid).
 */
export function pickReleases(
  releases: readonly MbBrowseRelease[]
): MbBrowseRelease[] {
  const filteredReleases: MbBrowseRelease[] = releases.filter((release) => {
    const primaryType = release["release-group"]["primary-type"]?.toLowerCase()
    return (
      release.status === "Official" &&
      primaryType !== undefined &&
      (IMPORTED_RELEASE_TYPES as readonly string[]).includes(primaryType) &&
      release["release-group"]["secondary-types"].length === 0
    );
  });

  const groupedReleases: Map<string, MbBrowseRelease[]> = Map.groupBy(filteredReleases, (release) => release["release-group"].id);

  const selectedReleases: MbBrowseRelease[] = Array.from(groupedReleases.values()).map((group) => group.toSorted(compareReleases)[0]);

  return selectedReleases;
}

function compareReleases(a: MbBrowseRelease, b: MbBrowseRelease): number {
  const firstReleaseDate = a["release-group"]["first-release-date"];

  const aIsOriginal: boolean = !!a.date && a.date === firstReleaseDate;

  const bIsOriginal: boolean = !!b.date && b.date === firstReleaseDate;

  if (aIsOriginal && !bIsOriginal) return -1;
  if (!aIsOriginal && bIsOriginal) return 1;

  const aHasCover: boolean = a["cover-art-archive"].front;
  const bHasCover: boolean = b["cover-art-archive"].front;

  if (aHasCover && !bHasCover) return -1;
  if (!aHasCover && bHasCover) return 1;

  if (a.date && !b.date) return -1;
  if (!a.date && b.date) return 1;

  if (a.date && b.date && a.date < b.date) return -1;
  if (a.date && b.date && a.date > b.date) return 1;

  if (a.id < b.id) return -1;
  if (a.id > b.id) return 1;
  return 0;
}