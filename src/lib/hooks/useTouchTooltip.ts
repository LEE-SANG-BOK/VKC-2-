import { useEffect } from 'react'

export function useTouchTooltip(selector = '.vk-tooltip-target[data-tooltip]') {
    useEffect(() => {
        if (typeof window === 'undefined') return
        const mediaQuery = window.matchMedia('(hover: none)')
        if (!mediaQuery.matches) return

        let activeTooltip: HTMLElement | null = null
        let dismissTimeout: number | null = null

        const clearActive = () => {
            if (dismissTimeout !== null) {
                window.clearTimeout(dismissTimeout)
                dismissTimeout = null
            }
            if (activeTooltip) {
                activeTooltip.removeAttribute('data-tooltip-visible')
                activeTooltip = null
            }
        }

        const scheduleDismiss = () => {
            if (dismissTimeout !== null) {
                window.clearTimeout(dismissTimeout)
            }
            dismissTimeout = window.setTimeout(() => {
                clearActive()
            }, 2200)
        }

        const handleTouchEnd = (event: TouchEvent) => {
            const target = (event.target as HTMLElement | null)?.closest(selector) as HTMLElement | null
            if (!target) {
                clearActive()
                return
            }

            if (activeTooltip && activeTooltip !== target) {
                activeTooltip.removeAttribute('data-tooltip-visible')
            }

            const shouldShow = target.getAttribute('data-tooltip-visible') !== 'true'
            if (shouldShow) {
                target.setAttribute('data-tooltip-visible', 'true')
                activeTooltip = target
                scheduleDismiss()
            } else {
                target.removeAttribute('data-tooltip-visible')
                activeTooltip = null
            }
        }

        const handleScroll = () => {
            clearActive()
        }

        document.addEventListener('touchend', handleTouchEnd, { passive: true })
        window.addEventListener('scroll', handleScroll, true)
        window.addEventListener('orientationchange', clearActive)

        return () => {
            document.removeEventListener('touchend', handleTouchEnd)
            window.removeEventListener('scroll', handleScroll, true)
            window.removeEventListener('orientationchange', clearActive)
            clearActive()
        }
    }, [selector])
}

export default useTouchTooltip
