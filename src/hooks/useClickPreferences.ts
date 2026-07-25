'use client'

import { useEffect, useState } from 'react'

const KEYS = {
  sound: 'click_sound_enabled',
  visual: 'click_visual_enabled',
} as const

export function useClickPreferences() {
  const [soundEnabled, setSoundState] = useState(true)
  const [visualEnabled, setVisualState] = useState(true)

  useEffect(() => {
    const s = localStorage.getItem(KEYS.sound)
    const v = localStorage.getItem(KEYS.visual)
    if (s !== null) setSoundState(s !== 'false')
    if (v !== null) setVisualState(v !== 'false')
  }, [])

  function setSoundEnabled(val: boolean) {
    setSoundState(val)
    localStorage.setItem(KEYS.sound, String(val))
  }

  function setVisualEnabled(val: boolean) {
    setVisualState(val)
    localStorage.setItem(KEYS.visual, String(val))
  }

  return { soundEnabled, setSoundEnabled, visualEnabled, setVisualEnabled }
}
