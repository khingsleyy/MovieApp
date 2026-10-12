import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Carousel from './Carousel'
import { MOVIE_GENRES, TV_GENRES } from '../lib/tmdb'

const GenreNav = ({ initialType = 'movie', activeKey = '' }) => {
    const [type, setType] = useState(initialType);
    const list = type === 'movie' ? MOVIE_GENRES : TV_GENRES;

    const toggleClass = (t) =>
        `px-3 py-1 rounded-full text-sm transition ${
            type === t
                ? 'bg-gradient-to-r from-accent to-accent-2 text-primary font-semibold'
                : 'text-light-200 hover:text-white'
        }`;

    return (
        <nav aria-label="Browse by genre" className="my-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex flex-shrink-0 gap-1 bg-white/5 border border-white/10 rounded-full p-1">
                <button type="button" aria-pressed={type === 'movie'} onClick={() => setType('movie')} className={toggleClass('movie')}>
                    Movies
                </button>
                <button type="button" aria-pressed={type === 'tv'} onClick={() => setType('tv')} className={toggleClass('tv')}>
                    TV Shows
                </button>
            </div>

            <div className="relative w-full flex-1 min-w-0">
                <Carousel className="gap-2 py-1! pr-12">
                    {list.map((g) => {
                        const key = `genre-${type}-${g.id}`;
                        const active = key === activeKey;
                        return (
                            <Link
                                key={key}
                                to={`/browse/${key}`}
                                aria-current={active ? 'page' : undefined}
                                className={`flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                                    active
                                        ? 'bg-gradient-to-r from-accent to-accent-2 text-primary font-semibold shadow-lg shadow-accent/30'
                                        : 'bg-white/5 border border-white/10 text-white hover:border-accent/50 hover:bg-white/10'
                                }`}
                            >
                                {g.name}
                            </Link>
                        );
                    })}
                </Carousel>

                {/* soft fade so the right edge reads as "scroll for more" */}
                <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-10 bg-gradient-to-l from-primary to-transparent z-[5]" />
            </div>
        </nav>
    )
}

export default GenreNav