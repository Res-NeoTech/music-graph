import { Geist_Mono, Instrument_Sans } from "next/font/google"
import { Metadata } from "next";

import "./globals.css"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";

const instrumentSans = Instrument_Sans({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://music-graph.maksym.ch"),

  title: {
    default: "Music Graph",
    template: "%s — Music Graph",
  },

  description: "Web application for exploring connections between artists in the form of a graph.",

  openGraph: {
    url: "https://music-graph.maksym.ch",
    title: "Music Graph",
    description: "Web application for exploring connections between artists in the form of a graph.",
    siteName: "Music Graph",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Music Graph : explore connections between artists',
      },
    ],
    locale: 'en_US',
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Music Graph",
    description: "Web application for exploring connections between artists in the form of a graph.",
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Music Graph : explore connections between artists',
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", instrumentSans.variable)}
    >
      <body className="flex min-h-svh flex-col">
        <ThemeProvider>
          {/* Lien d'évitement : invisible tant qu'il n'a pas le focus clavier. */}
          <a
            href="#main"
            className="sr-only rounded-lg bg-background px-3 py-2 text-sm font-medium focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:ring-3 focus:ring-ring/30"
          >
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  )
}
