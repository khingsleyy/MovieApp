import { useSyncExternalStore } from 'react'

const LIST_KEY = 'mylist-v1'
const RECENT_KEY = 'recent-v1'
const MAX_RECENT = 20

const cache = new Map()
const listeners = new Set()

const read = (key) => {
    if (!cache.has(key)) {
        let value = []
        try {
            const raw = localStorage.getItem(key)
            const parsed = raw ? JSON.parse(raw) : []
            if (Array.isArray(parsed)) value = parsed
        } catch {
            // storage unavailable or corrupted: start empty
        }
        cache.set(key, value)
    }
    return cache.get(key)
}

const write = (key, value) => {
    cache.set(key, value)
    try {
        localStorage.setItem(key, JSON.stringify(value))
    } catch {
        // storage can be unavailable (private mode); the in-memory copy still works
    }
    listeners.forEach((l) => l())
}

// keep other tabs in sync
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
        if (e.key === LIST_KEY || e.key === RECENT_KEY || e.key === null) {
            cache.clear()
            listeners.forEach((l) => l())
        }
    })
}

const subscribe = (callback) => {
    listeners.add(callback)
    return () => listeners.delete(callback)
}

// store only what the cards need
const slim = (item, type) => ({
    id: item.id,
    type,
    title: item.title || item.name || '',
    poster_path: item.poster_path || null,
    vote_average: item.vote_average || 0,
    date: item.release_date || item.first_air_date || '',
    original_language: item.original_language || '',
    overview: item.overview || '',
})

export const useWatchlist = () => {
    const items = useSyncExternalStore(subscribe, () => read(LIST_KEY))

    const has = (type, id) => items.some((i) => i.type === type && i.id === id)

    const toggle = (item, type) => {
        const current = read(LIST_KEY)
        if (current.some((i) => i.type === type && i.id === item.id)) {
            write(LIST_KEY, current.filter((i) => !(i.type === type && i.id === item.id)))
        } else {
            write(LIST_KEY, [slim(item, type), ...current])
        }
    }

    return { items, has, toggle }
}

export const addRecent = (item, type) => {
    if (!item || !item.id) return
    const rest = read(RECENT_KEY).filter((i) => !(i.type === type && i.id === item.id))
    write(RECENT_KEY, [slim(item, type), ...rest].slice(0, MAX_RECENT))
}

export const useRecent = () => {
    const items = useSyncExternalStore(subscribe, () => read(RECENT_KEY))
    const clear = () => write(RECENT_KEY, [])
    return { items, clear }
}