'use client'

import { MouseEvent, useCallback } from 'react'

export function useItemClick() {
  const handleClick = useCallback((e: MouseEvent<HTMLElement>) => {
    const audio = new Audio('/sounds/click.mp3')
    audio.volume = 0.3
    audio.play().catch(() => {})

    const target = e.currentTarget
    const rect = target.getBoundingClientRect()
    const ripple = document.createElement('div')
    ripple.className = 'ripple'
    ripple.style.left = `${e.clientX - rect.left}px`
    ripple.style.top = `${e.clientY - rect.top}px`
    target.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }, [])

  return { handleClick }
}
