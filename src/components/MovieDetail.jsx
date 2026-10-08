import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${API_KEY}`,
    }
}

const MovieDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                const response = await fetch(
                    `${API_BASE_URL}/movie/${id}?append_to_response=videos`,
                    API_OPTIONS
                );
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const data = await response.json();
                setMovie(data);
            } catch (error) {
                console.error('Error fetching movie details:', error);
                setMovie(null);
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
    }, [id]);

    if (loading) return (
        <main className="min-h-screen bg-primary flex items-center justify-center">
            <p className="text-white text-xl">Loading...</p>
        </main>
    );

    if (!movie) return (
        <main className="min-h-screen bg-primary flex items-center justify-center">
            <p className="text-white text-xl">Movie not found</p>
        </main>
    );

    return (
        <main className="min-h-screen bg-[#030014] text-white">
            <div className="max-w-5xl mx-auto px-5 py-10">

                <button
                    onClick={() => navigate(-1)}
                    className="mb-6 flex items-center gap-2 text-light-200 hover:text-white transition"
                >
                    ← Back
                </button>

                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    <img
                        src={movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '/no-movie.png'}
                        alt={movie.title}
                        className="w-[200px] h-[300px] object-cover rounded-xl flex-shrink-0"
                    />
                    <div className="flex flex-col gap-3">
                        <h1 className="text-4xl font-bold text-left mx-0 max-w-none">{movie.title}</h1>
                        <div className="flex items-center gap-3 text-light-200">
                            <span>⭐ {movie.vote_average?.toFixed(1)}</span>
                            <span>•</span>
                            <span>{movie.release_date ? movie.release_date.split('-')[0] : 'N/A'}</span>
                            <span>•</span>
                            <span>{movie.runtime} min</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {movie.genres?.map(genre => (
                                <span
                                    key={genre.id}
                                    className="px-3 py-1 bg-light-100/10 rounded-full text-sm text-light-100"
                                >
                                    {genre.name}
                                </span>
                            ))}
                        </div>
                        <p className="text-light-200 leading-relaxed mt-2">
                            {movie.overview}
                        </p>
                    </div>
                </div>

                {/* 🎬 DYNAMIC FULL PLAYER EMBED CONTAINER */}
                <div className="w-full rounded-xl overflow-hidden bg-black aspect-video shadow-2xl border border-white/5">
                    <iframe
                        src={`https://vidsrc.sh/embed/movie/${id}`}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                        allowFullScreen
                        title={`${movie.title} player`}
                        scrolling="no"
                    ></iframe>
                </div>

            </div>
        </main>
    )
}

export default MovieDetail