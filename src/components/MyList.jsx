import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MovieCard from './MovieCard'
import MediaCard from './MediaCard'
import { useWatchlist } from '../lib/library'

const MyList = () => {
    const navigate = useNavigate()
    const { items } = useWatchlist()

    useEffect(() => {
        document.title = 'My List | MovieApp'
    }, [])

    return (
        <main className="min-h-screen bg-primary text-white">
            <div className="max-w-6xl mx-auto px-5 py-10">
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 text-light-200 hover:text-white transition"
                >
                    ← Home
                </button>

                <h1 className="text-4xl font-bold mb-2 text-left mx-0 max-w-none text-gradient">
                    My List
                </h1>
                <p className="text-light-200 mb-6">
                    {items.length} saved {items.length === 1 ? 'title' : 'titles'}, stored on this device.
                </p>

                {items.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center">
                        <p className="text-lg font-semibold mb-2">Nothing saved yet</p>
                        <p className="text-light-200 mb-5">
                            Tap the heart on any movie or show to add it here.
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-accent to-accent-2 text-primary font-bold shadow-lg shadow-accent/30 hover:scale-105 transition"
                        >
                            Browse titles
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                        {items.map((item) => {
                            const data = { ...item, release_date: item.date }
                            return item.type === 'tv' ? (
                                <MediaCard key={`tv-${item.id}`} item={data} type="tv" />
                            ) : (
                                <MovieCard key={`movie-${item.id}`} movie={data} />
                            )
                        })}
                    </div>
                )}
            </div>
        </main>
    )
}

export default MyList