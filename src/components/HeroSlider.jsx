import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL, API_OPTIONS } from '../lib/tmdb'

const INTERVAL = 6000

const HeroSlider = () => {
    const navigate = useNavigate()
    const [slides, setSlides] = useState([])
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)

    useEffect(() => {
        fetch(`${API_BASE_URL}/trending/movie/week`, API_OPTIONS)
            .then((r) => r.json())
            .then((d) => {
                const withBackdrop = (d.results || []).filter((m) => m.backdrop_path).slice(0, 6)
                setSlides(withBackdrop)
            })
            .catch((e) => console.error('Hero error:', e))
    }, [])

    const go = useCallback(
        (dir) => setIndex((i) => (i + dir + slides.length) % slides.length),
        [slides.length]
    )

    useEffect(() => {
        if (paused || slides.length < 2) return
        const t = setInterval(() => go(1), INTERVAL)
        return () => clearInterval(t)
    }, [paused, slides.length, go, index])

    if (!slides.length) {
        return <div className="mt-6 h-[60vh] min-h-[360px] rounded-2xl bg-light-100/5 animate-pulse" />
    }

    const arrowClass =
        'absolute top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover/hero:opacity-100 hover:bg-black/70 transition'

    return (
        <section
            className="group/hero relative mt-6 h-[60vh] min-h-[360px] max-h-[620px] rounded-2xl overflow-hidden bg-dark-100"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {slides.map((m, i) => {
                const active = i === index
                return (
                    <div
                        key={m.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                            active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                    >
                        <img
                            src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
                            alt={m.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[7000ms] ease-out ${
                                active ? 'scale-105' : 'scale-100'
                            }`}
                        />

                        <div className="absolute inset-0 bg-gradient-to-r from-[#030014] via-[#030014]/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030014] via-transparent to-[#030014]/30" />

                        <div className="absolute left-0 bottom-0 p-6 sm:p-10 max-w-xl flex flex-col gap-3">
                            <p className="text-xs uppercase tracking-widest text-light-200">Trending this week</p>
                            <h2 className="text-3xl sm:text-5xl font-bold text-white leading-tight">{m.title}</h2>
                            <div className="flex items-center gap-3 text-sm text-light-200">
                                <span>⭐ {m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</span>
                                <span>•</span>
                                <span>{m.release_date ? m.release_date.split('-')[0] : 'N/A'}</span>
                            </div>
                            <p className="text-sm sm:text-base text-white/85 line-clamp-3">{m.overview}</p>
                            <button
                                type="button"
                                onClick={() => navigate(`/movie/${m.id}`)}
                                className="self-start mt-1 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-sm font-bold text-[#030014] hover:scale-105 transition-transform"
                            >
                                View details →
                            </button>
                        </div>
                    </div>
                )
            })}

            <button type="button" onClick={() => go(-1)} aria-label="Previous" className={`${arrowClass} left-4`}>
                ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className={`${arrowClass} right-4`}>
                ›
            </button>

            <div className="absolute bottom-5 right-6 z-20 flex gap-2">
                {slides.map((m, i) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === index ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>
        </section>
    )
}

export default HeroSlider