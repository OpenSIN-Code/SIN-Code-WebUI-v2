/**
 Purpose: Minimal DOM-side type shims for APIs not yet in standard lib.dom types.
 Docs: speech.d.doc.md
 */

export interface SpeechRecognitionAlternativeLike {
  transcript: string
}

export interface SpeechRecognitionResultLike {
  [index: number]: SpeechRecognitionAlternativeLike
  isFinal: boolean
  length: number
}

export interface SpeechRecognitionResultListLike {
  [index: number]: SpeechRecognitionResultLike
  length: number
}

export interface SpeechRecognitionEventLike {
  results: SpeechRecognitionResultListLike
}

export interface SpeechRecognitionInstanceLike {
  lang: string
  interimResults: boolean
  continuous: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: Event) => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstanceLike
    webkitSpeechRecognition?: new () => SpeechRecognitionInstanceLike
  }
}

export type SpeechRecognitionCtor =
  | Window['SpeechRecognition']
  | Window['webkitSpeechRecognition']

export type SpeechRecognitionInstance = InstanceType<NonNullable<SpeechRecognitionCtor>>
