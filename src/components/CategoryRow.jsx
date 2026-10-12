import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import MediaCard from './MediaCard'
import Carousel from './Carousel'
import { getCategory, fetchCategory } from '../lib/tmdb'

const CategoryRow = ({ category }) => {
    const cfg = getCategory(category)
    const ref = useRef(null)

    const [visible, setVisible] = useState(false)
    const [items, setItems] = useState([])
    const [type, setType] = useState(cfg ? cfg.type : 'tv')
    const [loaded, setLoaded] = useState(false)
    const [error, setError] = useState(false)
    const [attempt, setAttempt] = useState(0)

    // start loading only when the row is about to scroll into view
    useEffect(() => {
        const node = ref.current
        if (!node) return

        if (typeof IntersectionObserver === 'undefined') {
            setVisible(true)
            return
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true)
                    observer.disconnect()
                }
            },
            { rootMargin: '500px 0px' }
        )

        observer.observe(node)
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        if (!visible || !cfg) return

        let cancelled = false
        setError(false)

        fetchCategory(category)
            .then(({ results, type }) => {
                if (cancelled) return
                setItems(results.slice(0, 12))
                setType(type)
                setLoaded(true)
            })
            .catch((e) => {
                if (cancelled) return
                console.error('Row error:', e)
                setError(true)
            })

        return () => {
            cancelled = true
        }
    }, [visible, category, attempt])

    if (!cfg) return null
    // finished loading with nothing to show: hide the row
    if (loaded && items.length === 0) return null

    return (
        <section ref={ref} className="mt-10">
            <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-2 shadow-md shadow-accent/50" />
                    <span className="text-gradient">{cfg.label}</span>
                </h2>
                <Link to={`/browse/${category}`} className="text-accent-2 hover:text-white transition">
                    See all →
                </Link>
            </div>

            {items.length > 0 ? (
                <Carousel roomy className="gap-5">
                    {items.map((item) => (
                        <div key={item.id} className="flex-shrink-0">
                            <MediaCard item={item} type={type} expand />
                        </div>
                    ))}
                </Carousel>
            ) : error ? (
                <div role="alert" className="h-[120px] flex items-center gap-3 text-light-200">
                    <p>Could not load this row.</p>
                    <button
                        type="button"
                        onClick={() => setAttempt((n) => n + 1)}
                        className="underline hover:text-white"
                    >
                        Try again
                    </button>
                </div>
            ) : (
                // reserves the row's height so the page doesn't jump when it loads
                <div className="skeleton h-[355px] rounded-xl" aria-hidden="true" />
            )}
        </section>
    )
}

export default CategoryRow