'use client'

import { useEffect } from 'react'

export function GlobalClickEffect() {
  useEffect(() => {
    const container = document.createElement('div')
    container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9999;overflow:hidden'
    document.body.appendChild(container)

    const audio = new Audio('/sounds/click.mp3')
    audio.volume = 0.3

    function handleClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest('input, textarea, select, [contenteditable="true"]')) return

      const soundEnabled = localStorage.getItem('click_sound_enabled') !== 'false'
      const visualEnabled = localStorage.getItem('click_visual_enabled') !== 'false'

      if (soundEnabled) {
        audio.currentTime = 0
        audio.play().catch(() => {})
      }

      if (visualEnabled) {
        const ripple = document.createElement('div')
        ripple.className = 'ripple'
        ripple.style.left = `${e.clientX}px`
        ripple.style.top = `${e.clientY}px`
        container.appendChild(ripple)
        setTimeout(() => ripple.remove(), 600)
      }
    }

    document.addEventListener('click', handleClick)
    return () => {
      document.removeEventListener('click', handleClick)
      container.remove()
    }
  }, [])

  return null
}
