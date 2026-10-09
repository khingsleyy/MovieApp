export const API_BASE_URL = 'https://api.themoviedb.org/3';
export const API_OPTIONS = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_TMDB_API_KEY}`,
    },
};

const POP = 'sort_by=popularity.desc';

export const CATEGORIES = {
    'trending-movies': { label: 'Trending Movies', type: 'movie', path: '/trending/movie/week' },
    'trending-tv': { label: 'Trending TV Shows', type: 'tv', path: '/trending/tv/week' },
    'now-playing': { label: 'In Cinemas Now', type: 'movie', path: '/movie/now_playing' },
    upcoming: { label: 'Coming Soon', type: 'movie', path: '/movie/upcoming' },
    'top-movies': { label: 'Top Rated Movies', type: 'movie', path: '/movie/top_rated' },
    'top-tv': { label: 'Top Rated Shows', type: 'tv', path: '/tv/top_rated' },
    series: { label: 'Series', type: 'tv', path: '/discover/tv', params: POP },
    anime: {
        label: 'Anime',
        type: 'tv',
        path: '/discover/tv',
        params: `with_genres=16&with_origin_country=JP&${POP}`,
    },
    'anime-movies': {
        label: 'Anime Movies',
        type: 'movie',
        path: '/discover/movie',
        params: `with_genres=16&with_original_language=ja&${POP}`,
    },
    kdrama: {
        label: 'K-Drama',
        type: 'tv',
        path: '/discover/tv',
        params: `with_origin_country=KR&with_genres=18&${POP}`,
    },
    turkish: {
        label: 'Turkish Dramas',
        type: 'tv',
        path: '/discover/tv',
        params: `with_origin_country=TR&with_genres=18&${POP}`,
    },
    nollywood: {
        label: 'Nollywood',
        type: 'movie',
        path: '/discover/movie',
        params: `with_origin_country=NG&${POP}`,
    },
    bollywood: {
        label: 'Bollywood',
        type: 'movie',
        path: '/discover/movie',
        params: `with_origin_country=IN&with_original_language=hi&${POP}`,
    },
    reality: {
        label: 'Reality TV',
        type: 'tv',
        path: '/discover/tv',
        params: `with_genres=10764&${POP}`,
    },
    documentaries: {
        label: 'Documentaries',
        type: 'movie',
        path: '/discover/movie',
        params: `with_genres=99&${POP}`,
    },
};

export const MOVIE_GENRES = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 36, name: 'History' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
];

export const TV_GENRES = [
    { id: 10759, name: 'Action & Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 10762, name: 'Kids' },
    { id: 9648, name: 'Mystery' },
    { id: 10763, name: 'News' },
    { id: 10764, name: 'Reality' },
    { id: 10765, name: 'Sci-Fi & Fantasy' },
    { id: 10766, name: 'Soap' },
    { id: 10767, name: 'Talk' },
    { id: 10768, name: 'War & Politics' },
    { id: 37, name: 'Western' },
];

// Works for normal categories ("anime") and genre keys ("genre-movie-27")
export const getCategory = (key) => {
    if (CATEGORIES[key]) return CATEGORIES[key];

    const match = key.match(/^genre-(movie|tv)-(\d+)$/);
    if (!match) return null;

    const [, type, id] = match;
    const list = type === 'movie' ? MOVIE_GENRES : TV_GENRES;
    const genre = list.find((g) => String(g.id) === id);
    if (!genre) return null;

    return {
        label: `${genre.name} ${type === 'movie' ? 'Movies' : 'Shows'}`,
        type,
        path: `/discover/${type}`,
        params: `with_genres=${id}&${POP}`,
    };
};

export const fetchCategory = async (key, page = 1) => {
    const c = getCategory(key);
    if (!c) throw new Error('Unknown category');
    const url = `${API_BASE_URL}${c.path}?page=${page}${c.params ? `&${c.params}` : ''}`;
    const res = await fetch(url, API_OPTIONS);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return { results: data.results || [], totalPages: data.total_pages || 1, type: c.type };
};