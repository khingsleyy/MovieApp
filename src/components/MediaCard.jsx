import React from 'react'
import { useNavigate } from 'react-router-dom'

// expand = used inside carousels: the card widens on hover and pushes its neighbours aside
const MediaCard = ({ item, type, expand = false }) => {
    const navigate = useNavigate();
    const title = item.title || item.name;
    const date = item.release_date || item.first_air_date;

    const cardClass = expand
        ? 'movie-card group/card relative cursor-pointer overflow-hidden w-[200px] hover:w-[390px] transition-[width,box-shadow] duration-300 ease-out hover:shadow-2xl hover:shadow-[#AB8BFF]/40 hover:ring-1 hover:ring-[#AB8BFF]/60'
        : 'movie-card group/card relative cursor-pointer transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#AB8BFF]/30';

    const posterSrc = item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '/no-movie.png';

    return (
        <div className={cardClass} onClick={() => navigate(`/${type}/${item.id}`)}>
            {expand ? (
                <div className="relative overflow-hidden rounded-lg h-[200px] group-hover/card:h-[250px] transition-[height] duration-300 ease-out">
                    <img
                        src={posterSrc}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* fixed width = text never re-wraps while the card widens */}
                    <div className="absolute inset-y-0 left-0 w-[366px] flex flex-col justify-end gap-3 p-4 bg-gradient-to-t from-black/90 via-black/60 to-black/20 opacity-0 transition-opacity duration-300 ease-out will-change-[opacity] group-hover/card:opacity-100">
                        <p className="text-sm leading-snug text-white line-clamp-6">
                            {item.overview || 'No description available yet.'}
                        </p>
                        <span className="self-start px-4 py-1.5 rounded-full bg-gradient-to-r from-[#D6C7FF] to-[#AB8BFF] text-xs font-bold text-[#030014]">
                            View details →
                        </span>
                    </div>
                </div>
            ) : (
                <img src={posterSrc} alt={title} />
            )}

            <h3>{title}</h3>
            <div className="content">
                <div className="rating">
                    <img src="/star.svg" alt="star Icon" />
                    <p>{item.vote_average ? item.vote_average.toFixed(1) : 'N/A'}</p>
                </div>
                <span>•</span>
                <p className="lang">{item.original_language}</p>
                <span>•</span>
                <p className="year">{date ? date.split('-')[0] : 'N/A'}</p>
            </div>
        </div>
    )
}

export default MediaCard