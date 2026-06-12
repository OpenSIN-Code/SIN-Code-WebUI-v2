"use client"

import html2canvas from "html2canvas-pro"

export type SelectionRect = { x: number; y: number; width: number; height: number; dpr: number }

export async function captureIframeArea(
  iframe: HTMLIFrameElement,
  sel: SelectionRect,
): Promise<Blob> {
  const doc = iframe.contentDocument
  if (!doc) throw new Error("Preview iframe is cross-origin — cannot capture")

  const canvas = await html2canvas(doc.body, {
    x: sel.x,
    y: sel.y,
    width: sel.width,
    height: sel.height,
    scale: sel.dpr,
    useCORS: true,
    logging: false,
  })

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png")
  })
}

export async function uploadScreenshot(blob: Blob): Promise<{ id: string; url: string }> {
  const form = new FormData()
  form.append("file", blob, "screenshot.png")
  const res = await fetch("/api/workspace/screenshot", { method: "POST", body: form })
  if (!res.ok) throw new Error("Screenshot upload failed")
  return res.json()
}
