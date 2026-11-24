import { findAll as findAllArtists } from "@/lib/data/artists";
import { findAll as findAllReleases } from "@/lib/data/releases";
import type { Artist, Release } from "@/lib/types";

const BASE_URL: string = process.env.NODE_ENV === "production" ? "https://music-graph.maksym.ch" : "http://localhost:3000"

export const revalidate: number = 86400;

export default async function sitemap() {
  const artists: Artist[] = await findAllArtists();
  const releases: Release[] = await findAllReleases();
  const sitemapArtists: Array<{ url: string, lastModified: Date }> = [];
  const sitemapReleases: Array<{ url: string, lastModified: Date }> = [];

  artists.forEach((artist) => {
    sitemapArtists.push({
      url: `${BASE_URL}/artists/${artist.mbid}`,
      lastModified: new Date()
    });
  });

  releases.forEach((release) => {
    sitemapArtists.push({
      url: `${BASE_URL}/releases/${release.mbid}`,
      lastModified: new Date()
    });
  });

  return [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/artists`,
      lastModified: new Date(),
    },
    {
      url: `${BASE_URL}/releases`,
      lastModified: new Date(),
    },
    ...sitemapArtists,
    ...sitemapReleases
  ];
}