"use client"

import useSWR from "swr"
import { useCallback, useRef } from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function useSoundNotification() {
  const { data } = useSWR<{ soundNotifications: boolean }>(
    "/api/settings/preferences",
    fetcher,
  )
  const ctxRef = useRef<AudioContext | null>(null)

  const notify = useCallback(() => {
    if (!data?.soundNotifications || document.hasFocus()) return
    const ctx = (ctxRef.current ??= new AudioContext())
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
  }, [data?.soundNotifications])

  return notify
}
