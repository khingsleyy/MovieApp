import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import MediaCard from './MediaCard'
import Carousel from './Carousel'
import { getCategory, fetchCategory } from '../lib/tmdb'

const CategoryRow = ({ category }) => {
    const cfg = getCategory(category);
    const [items, setItems] = useState([]);
    const [type, setType] = useState(cfg ? cfg.type : 'tv');

    useEffect(() => {
        fetchCategory(category)
            .then(({ results, type }) => {
                setItems(results.slice(0, 12));
                setType(type);
            })
            .catch((e) => console.error('Row error:', e));
    }, [category]);

    if (!cfg || !items.length) return null;

    return (
        <section className="mt-10">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-white text-2xl font-bold">{cfg.label}</h2>
                <Link to={`/browse/${category}`} className="text-light-200 hover:text-white">
                    See all →
                </Link>
            </div>
            <Carousel roomy className="gap-5">
                {items.map((item) => (
                    <div key={item.id} className="flex-shrink-0">
                        <MediaCard item={item} type={type} expand />
                    </div>
                ))}
            </Carousel>
        </section>
    )
}

export default CategoryRow