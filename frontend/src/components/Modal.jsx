import { useEffect } from 'react'
import { createPortal } from 'react-dom'

/**
 * Industry-standard modal using React Portal.
 * Renders directly into document.body, completely outside
 * the app's stacking context — so position:fixed always works.
 */
export default function Modal({ show, onClose, children }) {
    // Lock body scroll when modal is open
    useEffect(() => {
        if (!show) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [show])

    // Close on Escape key
    useEffect(() => {
        if (!show) return
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [show, onClose])

    if (!show) return null

    return createPortal(
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
            <div className="modal">
                {children}
            </div>
        </div>,
        document.body
    )
}
