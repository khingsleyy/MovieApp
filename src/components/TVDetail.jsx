
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL, API_OPTIONS } from '../lib/tmdb'

const TVDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [show, setShow] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [season, setSeason] = useState(1)
    const [episodes, setEpisodes] = useState([])
    const [selectedEpisode, setSelectedEpisode] = useState(null)
    const [episodesLoading, setEpisodesLoading] = useState(false)

    useEffect(() => {
        const controller = new AbortController()

        const loadShow = async () => {
            setLoading(true)
            setError('')
            setShow(null)
            setSelectedEpisode(null)

            try {
                const response = await fetch(
                    `${API_BASE_URL}/tv/${id}`,
                    { ...API_OPTIONS, signal: controller.signal }
                )

                if (!response.ok) throw new Error('Could not load show details')

                const data = await response.json()
                setShow(data)

                const firstSeason = data.seasons?.find(
                    (item) => item.season_number > 0
                )

                if (firstSeason) {
                    setSeason(firstSeason.season_number)
                } else {
                    setEpisodes([])
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err)
                    setError('Could not load this series. Please try again.')
                }
            } finally {
                if (!controller.signal.aborted) setLoading(false)
            }
        }

        loadShow()

        return () => controller.abort()
    }, [id])

    useEffect(() => {
        if (!show) return

        const controller = new AbortController()

        const loadEpisodes = async () => {
            setEpisodesLoading(true)
            setEpisodes([])
            setSelectedEpisode(null)

            try {
                const response = await fetch(
                    `${API_BASE_URL}/tv/${id}/season/${season}`,
                    { ...API_OPTIONS, signal: controller.signal }
                )

                if (!response.ok) throw new Error('Could not load episodes')

                const data = await response.json()
                const seasonEpisodes = data.episodes || []

                setEpisodes(seasonEpisodes)

                if (seasonEpisodes.length > 0) {
                    setSelectedEpisode(seasonEpisodes[0])
                }
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err)
                    setEpisodes([])
                }
            } finally {
                if (!controller.signal.aborted) setEpisodesLoading(false)
            }
        }

        loadEpisodes()

        return () => controller.abort()
    }, [id, season, show])

    if (loading) {
        return (
            <main className="min-h-screen bg-[#030014] text-white flex items-center justify-center">
                <p>Loading series...</p>
            </main>
        )
    }

    if (error || !show) {
        return (
            <main className="min-h-screen bg-[#030014] text-white p-8">
                <button onClick={() => navigate(-1)} className="mb-5 hover:text-gray-300">
                    ← Go back
                </button>
                <p>{error || 'Series not found.'}</p>
            </main>
        )
    }

    const poster = show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : null

    const backdrop = show.backdrop_path
        ? `https://image.tmdb.org/t/p/original${show.backdrop_path}`
        : null

    const episodeNumber = selectedEpisode?.episode_number

    const playerUrl = selectedEpisode
        ? `https://vidsrc.sh/embed/tv/${id}/${season}/${episodeNumber}`
        : ''

    return (
        <main className="min-h-screen bg-[#030014] text-white">
            <div className="max-w-7xl mx-auto px-5 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-300 hover:text-white transition"
                >
                    ← Go back
                </button>

                <section
                    className="rounded-2xl overflow-hidden bg-cover bg-center"
                    style={{
                        backgroundImage: backdrop
                            ? `linear-gradient(to right, rgba(3,0,20,0.96), rgba(3,0,20,0.72)), url(${backdrop})`
                            : 'linear-gradient(to right, #030014, #17112f)',
                    }}
                >
                    <div className="flex flex-col md:flex-row gap-7 p-6 md:p-10">
                        {poster && (
                            <img
                                src={poster}
                                alt={show.name}
                                className="w-40 md:w-64 rounded-xl object-cover self-start"
                            />
                        )}

                        <div className="flex-1">
                            <h1 className="text-3xl md:text-5xl font-bold mb-3">
                                {show.name}
                            </h1>

                            <p className="text-gray-300 mb-3">
                                {show.first_air_date?.slice(0, 4) || 'Release date unknown'}
                                {' · '}
                                {show.number_of_seasons || 0} seasons
                                {' · '}
                                {show.number_of_episodes || 0} episodes
                            </p>

                            {show.vote_average > 0 && (
                                <p className="mb-3">
                                    ⭐ {show.vote_average.toFixed(1)}/10
                                </p>
                            )}

                            <div className="flex flex-wrap gap-2 mb-5">
                                {show.genres?.map((genre) => (
                                    <span
                                        key={genre.id}
                                        className="px-3 py-1 rounded-full bg-white/10 text-sm"
                                    >
                                        {genre.name}
                                    </span>
                                ))}
                            </div>

                            <p className="text-gray-200 leading-7">
                                {show.overview || 'No description is available for this series.'}
                            </p>
                        </div>
                    </div>
                </section>

                <section className="mt-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                        <h2 className="text-2xl md:text-3xl font-bold">
                            Episodes
                        </h2>

                        <select
                            value={season}
                            onChange={(event) => setSeason(Number(event.target.value))}
                            className="bg-[#17112f] text-white border border-white/20 rounded-lg px-4 py-3"
                        >
                            {show.seasons
                                ?.filter((item) => item.season_number > 0)
                                .map((item) => (
                                    <option
                                        key={item.id}
                                        value={item.season_number}
                                    >
                                        Season {item.season_number}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {selectedEpisode && (
                        <div className="mb-8">
                            <h3 className="text-xl font-semibold mb-3">
                                S{String(season).padStart(2, '0')}E
                                {String(episodeNumber).padStart(2, '0')}
                                {' — '}
                                {selectedEpisode.name}
                            </h3>

                            <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                                <iframe
                                    key={`${id}-${season}-${episodeNumber}`}
                                    src={playerUrl}
                                    title={`${show.name} - ${selectedEpisode.name}`}
                                    className="w-full h-full"
                                    allowFullScreen
                                    referrerPolicy="origin"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                />
                            </div>

                            <p className="text-sm text-gray-400 mt-3">
                                If playback doesn't work, that episode may not be available on the player.
                            </p>
                        </div>
                    )}

                    {episodesLoading ? (
                        <p className="text-gray-300 py-6">Loading episodes...</p>
                    ) : episodes.length === 0 ? (
                        <p className="text-gray-300 py-6">
                            No episodes found for this season.
                        </p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {episodes.map((episode) => {
                                const active =
                                    selectedEpisode?.id === episode.id

                                const still = episode.still_path
                                    ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                                    : null

                                return (
                                    <button
                                        key={episode.id}
                                        type="button"
                                        onClick={() => {
                                            setSelectedEpisode(episode)
                                            window.scrollTo({
                                                top: 0,
                                                behavior: 'smooth',
                                            })
                                        }}
                                        className={`text-left rounded-xl overflow-hidden border transition ${
                                            active
                                                ? 'border-purple-400 bg-purple-500/15'
                                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                                        }`}
                                    >
                                        {still ? (
                                            <img
                                                src={still}
                                                alt={episode.name}
                                                loading="lazy"
                                                className="w-full aspect-video object-cover"
                                            />
                                        ) : (
                                            <div className="w-full aspect-video bg-white/5 flex items-center justify-center text-gray-400">
                                                Episode {episode.episode_number}
                                            </div>
                                        )}

                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2">
                                                {active ? '▶ ' : ''}
                                                E{episode.episode_number}: {episode.name}
                                            </h3>

                                            <p className="text-sm text-gray-300 line-clamp-3">
                                                {episode.overview || 'No episode description available.'}
                                            </p>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </section>
            </div>
        </main>
    )
}

export default TVDetail
