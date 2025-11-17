import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Space_Grotesk, DM_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { AppProvider } from "@/contexts/AppContext"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { SessionRecoveryProvider } from "@/components/providers/SessionRecoveryProvider"
import { SessionErrorBoundary } from "@/components/providers/SessionErrorBoundary"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

export const metadata: Metadata = {
  title: "Restaurant Dashboard",
  description: "Sistema de gestión para restaurantes - Vista Comandera y Barra",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${spaceGrotesk.variable} ${dmSans.variable}`}
      >
        <SessionErrorBoundary>
          <AuthProvider>
            <AppProvider>
              <QueryProvider>
                <SessionRecoveryProvider>
                    {children}
                </SessionRecoveryProvider>
              </QueryProvider>
            </AppProvider>
          </AuthProvider>
        </SessionErrorBoundary>
      </body>
    </html>
  )
}
