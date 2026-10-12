import React from 'react'
import { useWatchlist } from '../lib/library'

const HeartButton = ({ item, type, className = '' }) => {
    const { has, toggle } = useWatchlist()
    const saved = has(type, item.id)

    return (
        <button
            type="button"
            aria-pressed={saved}
            aria-label={saved ? 'Remove from My List' : 'Add to My List'}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
                // the card is a link, so stop the click from opening it
                e.preventDefault()
                e.stopPropagation()
                toggle(item, type)
            }}
            className={`z-20 grid place-items-center w-8 h-8 rounded-full border backdrop-blur-md text-white transition focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                saved
                    ? 'opacity-100 bg-accent border-accent shadow-lg shadow-accent/40'
                    : 'opacity-0 group-hover/card:opacity-100 [@media(pointer:coarse)]:opacity-100 bg-black/50 border-white/30 hover:bg-accent hover:border-accent'
            } ${className}`}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={saved ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
            >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        </button>
    )
}

export default HeartButton