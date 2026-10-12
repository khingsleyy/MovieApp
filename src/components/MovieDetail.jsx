
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { API_BASE_URL, API_OPTIONS } from '../lib/tmdb'
import ListButton from './ListButton'
import { addRecent } from '../lib/library'

const MovieDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    const [movie, setMovie] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const controller = new AbortController()

        const fetchMovie = async () => {
            setLoading(true)
            setError('')
            setMovie(null)

            try {
                const response = await fetch(
                    `${API_BASE_URL}/movie/${id}`,
                    { ...API_OPTIONS, signal: controller.signal }
                )

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const data = await response.json()
                setMovie(data)
            } catch (err) {
                if (err.name === 'AbortError') return

                console.error('Error fetching movie details:', err)
                setError('Could not load this movie. Please try again.')
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        fetchMovie()

        return () => controller.abort()
    }, [id])

    useEffect(() => {
        if (movie?.title) {
            document.title = `${movie.title} | MovieApp`
            if (movie) addRecent(movie, 'movie');
        }
    }, [movie])

    const goBack = () => {
        if (location.key !== 'default') {
            navigate(-1)
        } else {
            navigate('/')
        }
    }

    if (loading) {
        return (
            <main className="min-h-screen bg-primary flex items-center justify-center">
                <p className="text-white text-xl">Loading...</p>
            </main>
        )
    }

    if (!movie) {
        return (
            <main className="min-h-screen bg-primary text-white flex flex-col items-center justify-center gap-4 px-5">
                <p className="text-xl">
                    {error || 'Movie not found.'}
                </p>

                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2 rounded-full bg-light-100/10 hover:bg-light-100/20 transition"
                >
                    ← Back to home
                </button>

                {error && (
                    <button
                        onClick={() => navigate(0)}
                        className="underline text-light-200 hover:text-white"
                    >
                        Try again
                    </button>
                )}
            </main>
        )
    }

    // Build the player URL using the TMDB movie ID.
    const playerUrl = `https://vidsrc.sh/embed/movie/${encodeURIComponent(id)}`

    return (
        <main className="min-h-screen bg-primary text-white">
            <div className="relative z-10 max-w-5xl mx-auto px-5 py-10">
                <button
                    onClick={goBack}
                    className="mb-6 flex items-center gap-2 text-light-200 hover:text-white transition"
                >
                    ← Back
                </button>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <img
                        src={
                            movie.poster_path
                                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                                : '/no-movie.png'
                        }
                        alt={movie.title}
                        className="w-[160px] h-[240px] md:w-[200px] md:h-[300px] object-cover rounded-xl flex-shrink-0"
                    />

                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl md:text-4xl font-bold">
                            {movie.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-3 text-light-200">
                            {movie.vote_average > 0 && (
                                <span>⭐ {movie.vote_average.toFixed(1)}</span>
                            )}

                            {movie.vote_average > 0 && (
                                <span aria-hidden="true">•</span>
                            )}

                            <span>
                                {movie.release_date
                                    ? movie.release_date.split('-')[0]
                                    : 'N/A'}
                            </span>

                            {movie.runtime > 0 && (
                                <>
                                    <span aria-hidden="true">•</span>
                                    <span>{movie.runtime} min</span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {movie.genres?.map((genre) => (
                                <span
                                    key={genre.id}
                                    className="px-3 py-1 bg-light-100/10 rounded-full text-sm text-light-100"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>

                        <ListButton item={movie} type="movie" />
                        <p className="text-light-200 leading-relaxed mt-2">
                            {movie.overview ||
                                'No description is available for this movie.'}
                        </p>
                    </div>
                </div>

                {/* Movie player */}
                <section className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">
                        Watch {movie.title}
                    </h2>

                    <div className="w-full aspect-video overflow-hidden rounded-xl bg-black">
                        <iframe
                            key={playerUrl}
                            src={playerUrl}
                            title={`Watch ${movie.title}`}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                            allowFullScreen
                            referrerPolicy="origin"
                        />
                    </div>

                    <p className="text-sm text-light-200 mt-3">
                        If playback doesn't work, try refreshing the page
                        or selecting another title.
                    </p>
                </section>
            </div>
        </main>
    )
}

export default MovieDetail
