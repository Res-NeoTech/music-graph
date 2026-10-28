import type { MetadataRoute } from "next"

// Manifest de l'application web (icône sur l'écran d'accueil d'un téléphone).
// Les icônes sont servies depuis public/icons/.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Music Graph",
    short_name: "Music Graph",
    description:
      "Explorer les liens entre artistes et trouver le plus court chemin entre deux artistes.",
    start_url: "/",
    display: "standalone",
    background_color: "#1d161e",
    theme_color: "#1d161e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
