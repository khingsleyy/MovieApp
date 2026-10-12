
import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API_BASE_URL, API_OPTIONS } from '../lib/tmdb'
import ListButton from './ListButton'
import { addRecent } from '../lib/library'

// Remembers the last episode opened for each show in this browser.
const progressKey = (id) => `tv-progress-${id}`

const readProgress = (id) => {
    try {
        const raw = localStorage.getItem(progressKey(id))
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

const saveProgress = (id, season, episode) => {
    try {
        localStorage.setItem(
            progressKey(id),
            JSON.stringify({ season, episode })
        )
    } catch {
        // Storage can be unavailable in private browsing.
    }
}

const TVDetail = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [show, setShow] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // season = season currently playing; openSeason = expanded season.
    const [season, setSeason] = useState(1)
    const [openSeason, setOpenSeason] = useState(null)
    const [seasonData, setSeasonData] = useState({})
    const [selectedEpisode, setSelectedEpisode] = useState(null)
    const [retry, setRetry] = useState(0)

    const loadedSeasons = useRef(new Set())
    const autoPick = useRef(true)
    const wantedEpisode = useRef(null)

    // Load the show and restore the last watched episode.
    useEffect(() => {
        const controller = new AbortController()

        const loadShow = async () => {
            setLoading(true)
            setError('')
            setShow(null)
            setSelectedEpisode(null)
            setSeasonData({})
            setOpenSeason(null)
            setSeason(1)

            loadedSeasons.current = new Set()
            autoPick.current = true
            wantedEpisode.current = null

            try {
                const response = await fetch(
                    `${API_BASE_URL}/tv/${id}`,
                    { ...API_OPTIONS, signal: controller.signal }
                )

                if (!response.ok) {
                    throw new Error('Could not load show details')
                }

                const data = await response.json()

                const numbers = (data.seasons || [])
                    .filter((item) => item.season_number > 0)
                    .map((item) => item.season_number)

                const saved = readProgress(id)

                const start =
                    saved && numbers.includes(saved.season)
                        ? saved.season
                        : numbers[0]

                if (start !== undefined) {
                    wantedEpisode.current =
                        saved && saved.season === start
                            ? saved.episode
                            : null

                    setSeason(start)
                    setOpenSeason(start)
                }

                setShow(data)
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error(err)
                    setError(
                        'Could not load this series. Please try again.'
                    )
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false)
                }
            }
        }

        loadShow()

        return () => controller.abort()
    }, [id])

    // Load each expanded season once.
    useEffect(() => {
        if (!show || openSeason == null) return
        if (loadedSeasons.current.has(openSeason)) return

        const controller = new AbortController()
        const number = openSeason

        setSeasonData((prev) => ({
            ...prev,
            [number]: { status: 'loading', episodes: [] },
        }))

        const loadEpisodes = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/tv/${id}/season/${number}`,
                    {
                        ...API_OPTIONS,
                        signal: controller.signal,
                    }
                )

                if (!response.ok) {
                    throw new Error('Could not load episodes')
                }

                const data = await response.json()
                const episodes = data.episodes || []

                if (controller.signal.aborted) return

                loadedSeasons.current.add(number)

                setSeasonData((prev) => ({
                    ...prev,
                    [number]: { status: 'done', episodes },
                }))

                // On initial load, restore the saved episode or pick episode 1.
                if (autoPick.current) {
                    autoPick.current = false

                    const pick =
                        episodes.find(
                            (episode) =>
                                episode.episode_number ===
                                wantedEpisode.current
                        ) || episodes[0]

                    if (pick) {
                        setSeason(number)
                        setSelectedEpisode(pick)
                    }
                }
            } catch (err) {
                if (err.name === 'AbortError') return

                console.error(err)

                setSeasonData((prev) => ({
                    ...prev,
                    [number]: { status: 'error', episodes: [] },
                }))
            }
        }

        loadEpisodes()

        return () => controller.abort()
    }, [show, openSeason, id, retry])

    // Remember the last selected season and episode.
    useEffect(() => {
        if (selectedEpisode) {
            saveProgress(id, season, selectedEpisode.episode_number)
        }
    }, [id, season, selectedEpisode])

    useEffect(() => {
        if (show?.name) document.title = `${show.name} | MovieApp`
        if (show) addRecent(show, 'tv')
    }, [show])

    if (loading) {
        return (
            <main className="min-h-screen bg-primary text-white flex items-center justify-center">
                <p>Loading series...</p>
            </main>
        )
    }

    if (error || !show) {
        return (
            <main className="min-h-screen bg-primary text-white p-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-5 hover:text-gray-300"
                >
                    ← Go back
                </button>

                <p>{error || 'Series not found.'}</p>

                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 underline hover:text-white"
                >
                    Try again
                </button>
            </main>
        )
    }

    const poster = show.poster_path
        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
        : null

    const backdrop = show.backdrop_path
        ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
        : null

    const seasons = (show.seasons || []).filter(
        (item) => item.season_number > 0
    )

    const episodeNumber = selectedEpisode?.episode_number

    // Build the player URL from the show ID, season and selected episode.
    const playerUrl =
        selectedEpisode && id && episodeNumber != null
            ? `https://vidsrc.sh/embed/tv/${encodeURIComponent(id)}/${season}/${episodeNumber}`
            : ''

    const playEpisode = (seasonNumber, episode) => {
        setSeason(seasonNumber)
        setSelectedEpisode(episode)
    }

    // Find the next episode in the currently playing season.
    const playingEpisodes = seasonData[season]?.episodes || []

    const playingIndex = playingEpisodes.findIndex(
        (episode) => episode.id === selectedEpisode?.id
    )

    const nextEpisode =
        playingIndex >= 0
            ? playingEpisodes[playingIndex + 1]
            : null

    const nextSeasonNumber = seasons.find(
        (item) => item.season_number > season
    )?.season_number

    return (
        <main className="min-h-screen bg-primary text-white">
            <div className="max-w-7xl mx-auto px-5 py-8">
                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 text-gray-300 hover:text-white transition"
                >
                    ← Go back
                </button>

                {/* Series details */}
                <section
                    className="rounded-2xl overflow-hidden bg-cover bg-center"
                    style={{
                        backgroundImage: backdrop
                            ? `linear-gradient(to right, rgba(4,8,19,0.96), rgba(4,8,19,0.72)), url(${backdrop})`
                            : 'linear-gradient(to right, #040813, #0b1b3a)',
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
                            <h1 className="text-3xl md:text-5xl font-bold mb-3 text-left mx-0 max-w-none">
                                {show.name}
                            </h1>

                            <p className="text-gray-300 mb-3">
                                {show.first_air_date?.slice(0, 4) ||
                                    'Release date unknown'}
                                {' · '}
                                {show.number_of_seasons || 0} seasons
                                {' · '}
                                {show.number_of_episodes || 0} episodes
                            </p>

                            {show.vote_average > 0 && (
                                <p className="mb-3 text-gold font-semibold">
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
                            <div className="mb-5">
                                <ListButton item={show} type="tv" />
                            </div>
                            <p className="text-gray-200 leading-7">
                                {show.overview ||
                                    'No description is available for this series.'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Player and season list */}
                <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
                    {/* Sticky player column */}
                    <div className="sticky top-0 z-30 -mx-5 px-5 pt-2 pb-3 bg-primary/95 backdrop-blur-md lg:top-4 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:bg-transparent lg:backdrop-blur-none">
                        {selectedEpisode ? (
                            <div>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <h3 className="text-base sm:text-lg font-semibold truncate">
                                        S{String(season).padStart(2, '0')}E
                                        {String(episodeNumber).padStart(2, '0')}
                                        {' — '}
                                        {selectedEpisode.name}
                                    </h3>

                                    {nextEpisode ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                playEpisode(season, nextEpisode)
                                            }
                                            className="flex-shrink-0 px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 text-primary text-sm font-bold shadow-lg shadow-accent/30 hover:scale-105 transition"
                                        >
                                            Next episode →
                                        </button>
                                    ) : nextSeasonNumber ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOpenSeason(nextSeasonNumber)
                                            }
                                            className="flex-shrink-0 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition"
                                        >
                                            Season {nextSeasonNumber} →
                                        </button>
                                    ) : null}
                                </div>

                                {/* Episode player */}
                                {playerUrl ? (
                                    <>
                                        <div className="w-full aspect-video overflow-hidden rounded-xl bg-black">
                                            <iframe
                                                key={playerUrl}
                                                src={playerUrl}
                                                title={`${show.name} - Season ${season}, Episode ${episodeNumber}: ${selectedEpisode.name}`}
                                                className="w-full h-full border-0"
                                                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                                                allowFullScreen
                                                referrerPolicy="origin"
                                            />
                                        </div>

                                        <p className="text-sm text-light-200 mt-3">
                                            If playback doesn't work, try
                                            refreshing the page or selecting
                                            another episode.
                                        </p>
                                    </>
                                ) : (
                                    <div className="w-full aspect-video rounded-xl bg-black flex items-center justify-center text-light-200">
                                        Select an episode to start playback.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="w-full aspect-video rounded-xl border border-white/10 bg-white/5 flex items-center justify-center text-light-200 text-sm">
                                Pick an episode to start
                            </div>
                        )}
                    </div>

                    {/* Seasons and episodes */}
                    <div className="flex flex-col gap-3 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto hide-scrollbar">
                        <h2 className="text-2xl font-bold">Seasons</h2>

                        {seasons.length === 0 && (
                            <p className="text-gray-300 py-4">
                                No seasons found for this series.
                            </p>
                        )}

                        {seasons.map((item) => {
                            const open =
                                openSeason === item.season_number

                            const data = seasonData[item.season_number]

                            return (
                                <div
                                    key={item.id}
                                    className={`flex-shrink-0 rounded-xl border overflow-hidden transition ${
                                        open
                                            ? 'border-accent/50 bg-white/5'
                                            : 'border-white/10 bg-white/5'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        aria-expanded={open}
                                        onClick={() =>
                                            setOpenSeason(
                                                open
                                                    ? null
                                                    : item.season_number
                                            )
                                        }
                                        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                                    >
                                        <span>
                                            <span className="font-semibold">
                                                Season {item.season_number}
                                            </span>

                                            {item.episode_count > 0 && (
                                                <span className="text-sm text-light-200">
                                                    {' · '}
                                                    {item.episode_count} episodes
                                                </span>
                                            )}
                                        </span>

                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                            className={`flex-shrink-0 transition-transform duration-200 ${
                                                open ? 'rotate-180' : ''
                                            }`}
                                        >
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </button>

                                    {open && (
                                        <div className="border-t border-white/10">
                                            {data?.status === 'error' ? (
                                                <div
                                                    role="alert"
                                                    className="p-4 text-sm text-light-200"
                                                >
                                                    <p>
                                                        Could not load episodes.
                                                    </p>

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setRetry((n) => n + 1)
                                                        }
                                                        className="mt-2 underline hover:text-white"
                                                    >
                                                        Try again
                                                    </button>
                                                </div>
                                            ) : !data ||
                                            data.status === 'loading' ? (
                                                <div
                                                    className="p-3 flex flex-col gap-2"
                                                    aria-hidden="true"
                                                >
                                                    {[0, 1, 2, 3].map((n) => (
                                                        <div
                                                            key={n}
                                                            className="skeleton h-14 rounded-lg"
                                                        />
                                                    ))}
                                                </div>
                                            ) : data.episodes.length === 0 ? (
                                                <p className="p-4 text-sm text-light-200">
                                                    No episodes found for this
                                                    season.
                                                </p>
                                            ) : (
                                                <ul>
                                                    {data.episodes.map(
                                                        (episode) => {
                                                            const active =
                                                                selectedEpisode?.id ===
                                                                episode.id &&
                                                                season ===
                                                                item.season_number

                                                            return (
                                                                <li key={episode.id}>
                                                                    <button
                                                                        type="button"
                                                                        aria-current={
                                                                            active
                                                                                ? 'true'
                                                                                : undefined
                                                                        }
                                                                        onClick={() =>
                                                                            playEpisode(
                                                                                item.season_number,
                                                                                episode
                                                                            )
                                                                        }
                                                                        className={`w-full flex items-center gap-3 px-3 py-2 text-left transition ${
                                                                            active
                                                                                ? 'bg-accent/20'
                                                                                : 'hover:bg-white/5'
                                                                        }`}
                                                                    >
                                                                        <div className="relative w-24 aspect-video flex-shrink-0 rounded-md overflow-hidden bg-white/10 flex items-center justify-center text-xs text-gray-400">
                                                                            {episode.still_path ? (
                                                                                <img
                                                                                    src={`https://image.tmdb.org/t/p/w185${episode.still_path}`}
                                                                                    alt=""
                                                                                    loading="lazy"
                                                                                    decoding="async"
                                                                                    className="w-full h-full object-cover"
                                                                                />
                                                                            ) : (
                                                                                <span>
                                                                                    E
                                                                                    {episode.episode_number}
                                                                                </span>
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 flex-1">
                                                                            <p
                                                                                className={`truncate text-sm font-semibold ${
                                                                                    active
                                                                                        ? 'text-accent-2'
                                                                                        : ''
                                                                                }`}
                                                                            >
                                                                                {active
                                                                                    ? '▶ '
                                                                                    : ''}
                                                                                {episode.episode_number}
                                                                                .{' '}
                                                                                {episode.name}
                                                                            </p>

                                                                            {episode.runtime > 0 && (
                                                                                <p className="text-xs text-light-200 mt-0.5">
                                                                                    {episode.runtime}{' '}
                                                                                    min
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </button>
                                                                </li>
                                                            )
                                                        }
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>
        </main>
    )
}

export default TVDetail
