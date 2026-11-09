
import { writeFile } from "node:fs/promises";

const SEEDS = [
  // Core artists
  "Ye", "Young Thug", "Future", "Travis Scott", "Don Toliver",
  "Rick Ross", "Drake", "Kendrick Lamar", "Yeat",
  "Gunna", "Ty Dolla $ign",

  // Atlanta / Southern trap
  "21 Savage", "Lil Baby", "Migos", "Quavo", "Offset",
  "Takeoff", "Metro Boomin", "Wheezy", "Southside", "TM88",
  "Gucci Mane", "T.I.", "Waka Flocka Flame", "Jeezy",
  "2 Chainz", "Lil Durk", "Polo G", "Roddy Ricch",
  "Moneybagg Yo", "Key Glock", "Pooh Shiesty",
  "Kodak Black", "NBA YoungBoy", "Nardo Wick",
  "Latto", "Coi Leray", "Sexyy Red", "Flo Milli",
  "City Girls", "Megan Thee Stallion", "Young Nudy",

  // Modern melodic / underground trap
  "Playboi Carti", "Lil Uzi Vert", "A$AP Rocky", "FERG",
  "Swae Lee", "Nav", "Lil Yachty", "UnoTheActivist",
  "Destroy Lonely", "Ken Carson", "HXG", "Tezzus",
  "SoFaygo", "Sheck Wes", "Chase B", "Trippie Redd",
  "Ski Mask the Slump God", "XXXTentacion", "Lil Tecca",
  "Babyface Ray", "EST Gee", "Nine Vicious", "Che",

  // Ye / GOOD Music / collaborators
  "Kid Cudi", "Pusha T", "Big Sean",
  "Common", "070 Shake", "Vory", "Ant Clemons",

  // West Coast / lyrical rap
  "Denzel Curry", "Baby Keem", "J. Cole", "JID",
  "EarthGang", "Isaiah Rashad", "ScHoolboy Q", "Jay Rock",
  "Ab-Soul", "Vince Staples", "Tyler, The Creator",
  "Earl Sweatshirt", "Aminé", "Cordae", "Joey Bada$$",

  // Other influential connections
  "Freddie Gibbs", "G Herbo", "Chief Keef",
  "Meek Mill", "Wale", "French Montana",
  "Busta Rhymes", "Nas", "Jay-Z", "Lil Wayne",
  "Bryson Tiller", "Lil Tjay", "Fivio Foreign",
  "Rick Ross"
] as const;

const API = "https://musicbrainz.org/ws/2/artist/";

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

async function resolveArtist(name: string) {
  const params = new URLSearchParams({
    query: `artist:"${name.replaceAll('"', '\\"')}"`,
    fmt: "json",
    limit: "10",
  });

  const response = await fetch(`${API}?${params}`, {
    headers: {
      "User-Agent": "Music-Graph Agent/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`${name}: HTTP ${response.status}`);
  }

  const data = await response.json();

  const exact = data.artists?.filter(
    (artist: { name: string }) =>
      normalize(artist.name) === normalize(name)
  );

  if (!exact?.length) {
    throw new Error(`No exact MusicBrainz match: ${name}`);
  }

  if (exact.length > 1) {
    console.warn(`Multiple exact matches for ${name}:`, exact);
  }

  // Prefer the highest-scoring exact name match.
  const artist = exact.sort(
    (a: any, b: any) => b.score - a.score
  )[0];

  return {
    mbid: artist.id as string,
    name,
  };
}

async function main() {
  const unique = [...new Set(SEEDS)];

  const results = [];
  const failures = [];

  for (const [index, name] of unique.entries()) {
    // 3 retries to get the artist
    for (let i: number = 1; i <= 10; i++) {
      try {
        const artist = await resolveArtist(name);
        results.push(artist);
        console.log(`[${index + 1}/${unique.length}] ✓ ${name}`);
        break;
      } catch (error) {
        console.error(`[${index + 1}/${unique.length}] ✗ ${name} | Retrying ${i}/10`);
        await sleep(2500);
        if (i === 10) {
          failures.push({ name, error: String(error) });
        }
      }
    }

    if (index < unique.length - 1) {
      await sleep(1500);
    }
  }

  const output = `import { CorpusArtist } from "./corpus";\n\nexport const CORPUS: readonly CorpusArtist[] = ${JSON.stringify(results, null, 2)};\n`;

  await writeFile("import/corpus.generated.ts", output);

  console.log(`\nResolved: ${results.length}/${unique.length}`);
  console.log("Output: corpus.generated.ts");

  if (failures.length) {
    console.log("\nUnresolved artists:", failures);
  }
}

main().catch(console.error);