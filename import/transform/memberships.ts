import type { MbArtist } from "../musicbrainz/types"

import { toArtistRow } from "./artist"
import type { ArtistRow, MembershipRow } from "./types"
import { toPartialDate } from "./fields"

/** Type de la relation MusicBrainz entre un membre et son groupe. */
export const MEMBER_OF_BAND = "member of band"

/**
 * Artistes à l'autre bout des relations « member of band » (les membres d'un
 * groupe, ou les groupes d'une personne). Leur ligne `artists` doit exister
 * avant celle de `memberships`, à cause des clés étrangères.
 */
export function membershipArtists(artist: MbArtist): ArtistRow[] {
  const related = new Map<string, ArtistRow>()
  for (const relation of artist.relations ?? []) {
    if (relation.type === MEMBER_OF_BAND && relation.artist) {
      related.set(relation.artist.id, toArtistRow(relation.artist))
    }
  }
  return [...related.values()]
}

/**
 * Relations « member of band » d'un artiste (lookup avec inc=artist-rels)
 * → lignes de la table `memberships`.
 */
export function toMemberships(artist: MbArtist): MembershipRow[] {
  const filteredRelations = artist.relations?.filter((relation) => relation.type === MEMBER_OF_BAND && relation.artist) ?? [];

  const groups = [];

  for (const filteredRelation of filteredRelations) {
    if (filteredRelation.direction === "backward") {
      groups.push({
        groupMbid: artist.id,
        memberMbid: filteredRelation.artist?.id as string,
        begin: filteredRelation.begin as string | null,
        end: filteredRelation.end as string | null,
        ended: filteredRelation.ended,
        attributes: filteredRelation.attributes
      })
    } else {
      groups.push({
        groupMbid: filteredRelation.artist?.id as string,
        memberMbid: artist.id,
        begin: filteredRelation.begin as string | null,
        end: filteredRelation.end as string | null,
        ended: filteredRelation.ended,
        attributes: filteredRelation.attributes
      })
    }
  }

  const memberships = new Map<string, MembershipRow>();
  const ongoingMemberships = new Map<string, boolean>();

  for (const group of groups) {
    const key = `${group.groupMbid}:${group.memberMbid}`;

    const existing = memberships.get(key);

    const hasOngoingRelation = ongoingMemberships.get(key) === true || group.ended === false;

    ongoingMemberships.set(key, hasOngoingRelation);

    if (existing) {
      // Comparaison des attributes
      const oldAttributes = existing.detail?.split(", ") ?? [];
      const newAttributes = group.attributes.filter((attribute) => attribute.toLowerCase() !== "original");
      const combined = [...oldAttributes, ...newAttributes];
      const unique = [...new Set(combined)];

      // Choix de la date de début
      const startDate: string | null = (() => {
        if (existing.startDate && group.begin) {
          if (existing.startDate > group.begin) {
            return group.begin;
          } else {
            return existing.startDate;
          }
        } else if (existing.startDate) {
          return existing.startDate;
        } else if (group.begin) {
          return group.begin;
        } else {
          return null;
        }
      })();

      // Choix de la date de fin
      const finishDate: string | null = hasOngoingRelation
        ? null : (() => {
          if (group.ended === true) {
            if (existing.finishDate && group.end) {
              if (existing.finishDate > group.end) {
                return existing.finishDate;
              } else {
                return group.end;
              }
            } else if (existing.finishDate) {
              return existing.finishDate;
            } else if (group.end) {
              return group.end;
            } else {
              return null;
            }
          } else {
            return null;
          }
        })();

      memberships.set(key, {
        groupMbid: group.groupMbid,
        memberMbid: group.memberMbid,
        startDate: toPartialDate(startDate),
        finishDate: toPartialDate(finishDate),
        detail: unique.join(", ") || null
      });
    } else {
      memberships.set(key, {
        groupMbid: group.groupMbid,
        memberMbid: group.memberMbid,
        startDate: toPartialDate(group.begin),
        finishDate: hasOngoingRelation ? null : toPartialDate(group.end),
        detail: group.attributes.filter((attribute) => attribute.toLowerCase() !== "original").join(", ") || null
      });
    }
  }

  return Array.from(memberships.values());
}