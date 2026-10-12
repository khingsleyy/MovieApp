import React from 'react'
import MediaCard from './MediaCard'
import Carousel from './Carousel'
import { useRecent } from '../lib/library'

const RecentRow = () => {
    const { items, clear } = useRecent()

    if (items.length === 0) return null

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-2">
                <h2 className="flex items-center gap-3 text-2xl font-bold">
                    <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-2 shadow-md shadow-accent/50" />
                    <span className="text-gradient">Recently viewed</span>
                </h2>
                <button type="button" onClick={clear} className="text-sm text-light-200 hover:text-white transition">
                    Clear
                </button>
            </div>

            <Carousel roomy className="gap-5">
                {items.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex-shrink-0">
                        <MediaCard
                            item={{ ...item, release_date: item.date }}
                            type={item.type}
                            expand
                        />
                    </div>
                ))}
            </Carousel>
        </section>
    )
}

export default RecentRow