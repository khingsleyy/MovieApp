import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { tmdbGet } from '../lib/tmdb'

const INTERVAL = 6000

const HeroSlider = () => {
    const navigate = useNavigate()
    const [slides, setSlides] = useState([])
    const [index, setIndex] = useState(0)
    const [paused, setPaused] = useState(false)
    const touchStart = useRef(null)

    const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    useEffect(() => {
        let cancelled = false

        tmdbGet('/trending/movie/week')
            .then((d) => {
                if (cancelled) return
                setSlides((d.results || []).filter((m) => m.backdrop_path).slice(0, 6))
            })
            .catch((e) => console.error('Hero error:', e))

        return () => {
            cancelled = true
        }
    }, [])

    const go = useCallback(
        (dir) => setIndex((i) => (i + dir + slides.length) % slides.length),
        [slides.length]
    )

    useEffect(() => {
        if (paused || reducedMotion || slides.length < 2) return
        const t = setInterval(() => go(1), INTERVAL)
        return () => clearInterval(t)
    }, [paused, reducedMotion, slides.length, go, index])

    const onTouchStart = (e) => {
        touchStart.current = e.touches[0].clientX
    }

    const onTouchEnd = (e) => {
        if (touchStart.current === null) return
        const dx = e.changedTouches[0].clientX - touchStart.current
        touchStart.current = null
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1)
    }

    if (!slides.length) {
        return (
            <div
                className="skeleton mt-6 h-[60dvh] min-h-[360px] max-h-[620px] rounded-2xl"
                aria-hidden="true"
            />
        )
    }

    const arrowClass =
        'absolute top-1/2 -translate-y-1/2 z-40 w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm border border-white/30 text-white text-xl leading-none flex items-center justify-center hover:bg-accent hover:border-accent transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [@media(pointer:coarse)]:hidden'

    return (
        <section
            aria-roledescription="carousel"
            aria-label="Trending this week"
            className="gradient-border group/hero relative mt-6 h-[60dvh] min-h-[360px] max-h-[620px] rounded-2xl overflow-hidden bg-dark-100 shadow-2xl shadow-accent/20"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocusCapture={() => setPaused(true)}
            onBlurCapture={() => setPaused(false)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {slides.map((m, i) => {
                const active = i === index
                return (
                    <div
                        key={m.id}
                        inert={!active}
                        aria-hidden={!active}
                        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
                            active ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                        }`}
                    >
                        <img
                            src={`https://image.tmdb.org/t/p/w1280${m.backdrop_path}`}
                            alt=""
                            loading={i === 0 ? 'eager' : 'lazy'}
                            fetchPriority={i === 0 ? 'high' : 'auto'}
                            decoding="async"
                            className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[7000ms] ease-out motion-reduce:transition-none motion-reduce:scale-100 ${
                                active ? 'scale-105' : 'scale-100'
                            }`}
                        />

                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-primary/30" />

                        <div className="absolute left-0 bottom-0 pt-6 pb-14 pl-14 pr-6 sm:pl-20 sm:pr-10 max-w-xl flex flex-col gap-3">
                            <p className="self-start rounded-full border border-accent-2/40 bg-accent-2/10 px-3 py-1 text-xs uppercase tracking-widest text-accent-2 font-semibold backdrop-blur-sm">
                                Trending this week
                            </p>
                            <h2 className="text-3xl sm:text-5xl font-bold leading-tight bg-gradient-to-r from-white via-white to-accent-2 bg-clip-text text-transparent">
                                {m.title}
                            </h2>
                            <div className="flex items-center gap-3 text-sm text-light-200">
                                <span className="text-gold font-semibold">⭐ {m.vote_average ? m.vote_average.toFixed(1) : 'N/A'}</span>
                                <span aria-hidden="true">•</span>
                                <span>{m.release_date ? m.release_date.split('-')[0] : 'N/A'}</span>
                            </div>
                            <p className="text-sm sm:text-base text-white/85 line-clamp-3">{m.overview}</p>
                            <button
                                type="button"
                                onClick={() => navigate(`/movie/${m.id}`)}
                                className="self-start mt-1 px-6 py-2.5 rounded-full bg-gradient-to-r from-accent to-accent-2 text-sm font-bold text-primary shadow-lg shadow-accent/40 hover:scale-105 hover:shadow-accent/60 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                            >
                                View details →
                            </button>
                        </div>
                    </div>
                )
            })}

            <button type="button" onClick={() => go(-1)} aria-label="Previous slide" className={`${arrowClass} left-4 sm:left-5`}>
                ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next slide" className={`${arrowClass} right-4 sm:right-5`}>
                ›
            </button>

            <div className="absolute bottom-3 right-4 z-40 flex">
                {slides.map((m, i) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === index}
                        className="px-1 py-3"
                    >
                        <span
                            className={`block h-2 rounded-full transition-all duration-300 ${
                                i === index
                                    ? 'w-10 bg-gradient-to-r from-accent to-accent-2 shadow-md shadow-accent/50'
                                    : 'w-4 bg-white/50'
                            }`}
                        />
                    </button>
                ))}
            </div>
        </section>
    )
}

export default HeroSlider