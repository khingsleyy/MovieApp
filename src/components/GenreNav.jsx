import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import Carousel from './Carousel'
import { MOVIE_GENRES, TV_GENRES } from '../lib/tmdb'

const GenreNav = ({ initialType = 'movie', activeKey = '' }) => {
    const [type, setType] = useState(initialType);
    const list = type === 'movie' ? MOVIE_GENRES : TV_GENRES;

    const toggleClass = (t) =>
        `px-3 py-1 rounded-full text-sm transition ${
            type === t ? 'bg-light-100/25 text-white' : 'text-light-200 hover:text-white'
        }`;

    return (
        <div className="my-4 flex items-center gap-3">
            <div className="flex flex-shrink-0 gap-1 bg-light-100/10 rounded-full p-1">
                <button type="button" onClick={() => setType('movie')} className={toggleClass('movie')}>
                    Movies
                </button>
                <button type="button" onClick={() => setType('tv')} className={toggleClass('tv')}>
                    TV Shows
                </button>
            </div>

            <div className="relative flex-1 min-w-0">
                <Carousel className="gap-2 py-1! pr-12">
                    {list.map((g) => {
                        const key = `genre-${type}-${g.id}`;
                        const active = key === activeKey;
                        return (
                            <Link
                                key={key}
                                to={`/browse/${key}`}
                                className={`flex-shrink-0 whitespace-nowrap px-4 py-1.5 rounded-full text-sm transition ${
                                    active
                                        ? 'bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-[#030014] font-semibold'
                                        : 'bg-light-100/10 text-white hover:bg-light-100/20'
                                }`}
                            >
                                {g.name}
                            </Link>
                        );
                    })}
                </Carousel>

                {/* soft fade so the right edge reads as "scroll for more" */}
                <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-14 bg-gradient-to-l from-[#030014] to-transparent z-[5]" />
            </div>
        </div>
    )
}

export default GenreNav