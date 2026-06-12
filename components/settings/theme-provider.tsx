"use client"

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import useSWR from "swr"
import { useEffect } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function ThemePreferenceSync() {
  const { data } = useSWR<{ theme: "system" | "light" | "dark" }>(
    "/api/settings/preferences",
    fetcher,
  )
  const { setTheme } = useTheme()

  useEffect(() => {
    if (data?.theme) setTheme(data.theme)
  }, [data?.theme, setTheme])

  return null
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
      <ThemePreferenceSync />
      {children}
    </NextThemesProvider>
  )
}
