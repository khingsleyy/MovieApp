import React from 'react'
import { useWatchlist } from '../lib/library'

const ListButton = ({ item, type }) => {
    const { has, toggle } = useWatchlist()
    const saved = has(type, item.id)

    return (
        <button
            type="button"
            aria-pressed={saved}
            onClick={() => toggle(item, type)}
            className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                saved
                    ? 'bg-gradient-to-r from-accent to-accent-2 text-primary border-transparent shadow-lg shadow-accent/30'
                    : 'bg-white/5 border-white/20 text-white hover:border-accent/60 hover:bg-white/10'
            }`}
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
            {saved ? 'In My List' : 'Add to My List'}
        </button>
    )
}

export default ListButton