import React from 'react'
import { Link } from 'react-router-dom'
import HeartButton from './HeartButton'

// expand = used inside carousels: the card widens on hover/focus and pushes its neighbours aside
const MovieCard = ({ movie, expand = false }) => {
    const { id, title, vote_average, poster_path, release_date, original_language, overview } = movie;

    const focusRing =
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

    const cardClass = expand
        ? `movie-card group/card relative block cursor-pointer overflow-hidden w-[200px] hover:w-[390px] has-[:focus-visible]:w-[390px] transition-[width,box-shadow,border-color] duration-300 ease-out hover:border-accent/50 hover:shadow-2xl hover:shadow-accent/30 ${focusRing}`
        : `movie-card group/card relative block cursor-pointer transition duration-300 hover:-translate-y-1 hover:border-accent/50 hover:shadow-xl hover:shadow-accent/30 ${focusRing}`;

    const posterSrc = poster_path ? `https://image.tmdb.org/t/p/w500${poster_path}` : '/no-movie.png';

    return (
        <Link to={`/movie/${id}`} className={cardClass}>=
            {expand ? (
                <div className="relative overflow-hidden rounded-lg h-[200px] group-hover/card:h-[250px] group-has-[:focus-visible]/card:h-[250px] transition-[height] duration-300 ease-out">
                    <img
                        src={posterSrc}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* fixed width = text never re-wraps while the card widens */}
                    <div className="absolute inset-y-0 left-0 w-[366px] flex flex-col justify-end gap-3 p-4 bg-gradient-to-t from-black/90 via-black/60 to-black/20 opacity-0 transition-opacity duration-300 ease-out group-hover/card:opacity-100 group-has-[:focus-visible]/card:opacity-100">
                        <p className="text-sm leading-snug text-white line-clamp-6">
                            {overview || 'No description available yet.'}
                        </p>
                        <span className="self-start px-4 py-1.5 rounded-full bg-gradient-to-r from-accent to-accent-2 text-xs font-bold text-primary shadow-lg shadow-accent/40">
                            View details →
                        </span>
                    </div>

                    <HeartButton item={movie} type="movie" className="absolute top-2 left-2" />
                </div>
            ) : (
                <>
                    <img src={posterSrc} alt="" loading="lazy" decoding="async" />
                    <HeartButton item={movie} type="movie" className="absolute top-5 right-5" />
                </>
            )}

            <h3>{title}</h3>
            <div className="content">
                <div className="rating">
                    <img src="/star.svg" alt="" aria-hidden="true" />
                    <p>
                        <span className="sr-only">Rating </span>
                        {vote_average ? vote_average.toFixed(1) : 'N/A'}
                    </p>
                </div>
                <span aria-hidden="true">•</span>
                <p className="lang">{original_language}</p>
                <span aria-hidden="true">•</span>
                <p className="year">{release_date ? release_date.split('-')[0] : 'N/A'}</p>
            </div>
        </Link>
    )
}

export default MovieCard