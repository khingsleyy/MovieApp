
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MediaCard from './MediaCard'
import GenreNav from './GenreNav'
import { getCategory, fetchCategory } from '../lib/tmdb'

const BrowseList = ({ category }) => {
    const navigate = useNavigate()
    const cfg = getCategory(category)

    const [items, setItems] = useState([])
    const [type, setType] = useState(cfg ? cfg.type : 'tv')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!cfg) return

        let cancelled = false

        const loadItems = async () => {
            setLoading(true)
            setError('')

            try {
                const { results, totalPages, type } =
                    await fetchCategory(category, page)

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
    }, [category, page])

    if (!cfg) {
        return <p className="text-white p-10">Section not found</p>
    }

    return (
        <main className="min-h-screen bg-[#030014] text-white">
            <div className="max-w-6xl mx-auto px-5 py-10">
                <button
                    onClick={() => navigate('/')}
                    className="mb-6 text-light-200 hover:text-white transition"
                >
                    ← Home
                </button>

                <h1 className="text-4xl font-bold mb-2 text-left mx-0 max-w-none">
                    {cfg.label}
                </h1>

                <GenreNav initialType={cfg.type} activeKey={category} />

                {error && (
                    <div className="mt-5 text-red-400">
                        <p>{error}</p>
                        <button
                            onClick={() => {
                                setError('')
                                setPage((currentPage) => currentPage)
                            }}
                            className="mt-2 underline hover:text-white"
                        >
                            Try again
                        </button>
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

                <div className="flex justify-center mt-10">
                    {loading ? (
                        <p className="text-light-200">Loading...</p>
                    ) : page < totalPages ? (
                        <button
                            onClick={() => setPage((currentPage) => currentPage + 1)}
                            className="px-6 py-2 bg-light-100/10 rounded-full hover:bg-light-100/20 transition"
                        >
                            Load more
                        </button>
                    ) : items.length > 0 ? (
                        <p className="text-light-200">
                            You've reached the end of this section.
                        </p>
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
