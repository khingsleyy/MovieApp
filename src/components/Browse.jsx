import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MediaCard from './MediaCard'
import GenreNav from './GenreNav'
import { getCategory, fetchCategory, canFilter, SORT_OPTIONS } from '../lib/tmdb'

const thisYear = new Date().getFullYear()
const YEARS = Array.from({ length: thisYear - 1969 }, (_, i) => thisYear - i)

const selectClass =
    'bg-dark-100 text-white border border-white/15 rounded-full px-4 py-2 text-sm hover:border-accent/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'

const BrowseList = ({ category }) => {
    const navigate = useNavigate()
    const cfg = getCategory(category)

    const [items, setItems] = useState([])
    const [type, setType] = useState(cfg ? cfg.type : 'tv')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [retryCount, setRetryCount] = useState(0)
    const [sort, setSort] = useState('popular')
    const [year, setYear] = useState('')

    const sentinel = useRef(null)

    useEffect(() => {
        if (!cfg) return

        let cancelled = false

        const loadItems = async () => {
            setLoading(true)
            setError('')

            try {
                const { results, totalPages, type } =
                    await fetchCategory(category, page, { sort, year })

                if (cancelled) return

                setItems((prev) => {
                    const existingIds = new Set(prev.map((item) => item.id))
                    const newItems = results.filter(
                        (item) => !existingIds.has(item.id)
                    )

                    return [...prev, ...newItems]
                })

                setTotalPages(totalPages)
                setType(type)
            } catch (err) {
                if (!cancelled) {
                    console.error('Browse loading error:', err)
                    setError('Could not load this section. Please try again.')
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        loadItems()

        return () => {
            cancelled = true
        }
        // retryCount is here so the Try again button re-runs this effect
    }, [category, page, sort, year, retryCount])

    // infinite scroll: load the next page when the bottom marker comes into view
    useEffect(() => {
        const node = sentinel.current
        if (!node || loading || error || page >= totalPages) return

        if (typeof IntersectionObserver === 'undefined') return

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setPage((p) => p + 1)
            },
            { rootMargin: '600px 0px' }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [loading, error, page, totalPages])

    useEffect(() => {
        if (cfg) document.title = `${cfg.label} | MovieApp`
    }, [cfg])

    const changeFilter = (setter) => (event) => {
        setItems([])
        setPage(1)
        setTotalPages(1)
        setter(event.target.value)
    }

    if (!cfg) {
        return (
            <main className="min-h-screen bg-primary text-white flex flex-col items-center justify-center gap-4">
                <p>Section not found</p>
                <button
                    onClick={() => navigate('/')}
                    className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-accent/50 transition"
                >
                    ← Back to home
                </button>
            </main>
        )
    }

    const filterable = canFilter(cfg)

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
                    {cfg.label}
                </h1>

                <GenreNav initialType={cfg.type} activeKey={category} />

                {filterable && (
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                        <label className="sr-only" htmlFor="sort-select">Sort by</label>
                        <select id="sort-select" value={sort} onChange={changeFilter(setSort)} className={selectClass}>
                            {SORT_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <label className="sr-only" htmlFor="year-select">Release year</label>
                        <select id="year-select" value={year} onChange={changeFilter(setYear)} className={selectClass}>
                            <option value="">Any year</option>
                            {YEARS.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {error && (
                    <div role="alert" className="mt-5 text-red-400">
                        <p>{error}</p>
                        <button
                            onClick={() => setRetryCount((count) => count + 1)}
                            className="mt-2 underline hover:text-white"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading && items.length === 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-4" aria-hidden="true">
                        {Array.from({ length: 10 }, (_, n) => (
                            <div key={n} className="skeleton h-[300px] rounded-xl" />
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5 mt-4">
                    {items.map((item) => (
                        <MediaCard
                            key={`${type}-${item.id}`}
                            item={item}
                            type={type}
                        />
                    ))}
                </div>

                <div ref={sentinel} className="flex justify-center mt-10 min-h-10">
                    {loading && items.length > 0 ? (
                        <p className="text-light-200">Loading more...</p>
                    ) : !loading && !error && items.length > 0 && page >= totalPages ? (
                        <p className="text-light-200">
                            You've reached the end of this section.
                        </p>
                    ) : !loading && !error && items.length === 0 ? (
                        <p className="text-light-200">Nothing found. Try a different year or sort.</p>
                    ) : null}
                </div>
            </div>
        </main>
    )
}

const Browse = () => {
    const { category } = useParams()

    return <BrowseList key={category} category={category} />
}

export default Browse