import { Geist_Mono, Instrument_Sans } from "next/font/google"
import { Metadata } from "next";

import "./globals.css"
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
        alt: 'My Website preview image',
      },
    ],
    locale: 'en_US',
    type: "website"
  },

  twitter: {
    card: "summary_large_image",
    title: "Music Graph",
    description: "Web application for exploring connections between artists in the form of a graph.",
    images: [ '/og-image.png' ],
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
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
