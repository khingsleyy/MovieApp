export const API_BASE_URL = '/api/tmdb';
export const API_OPTIONS = {
    method: 'GET',
    headers: { accept: 'application/json' },
};

const CACHE_TTL = 5 * 60 * 1000;
const cache = new Map();

const request = async (url, signal) => {
    const res = await fetch(url, { ...API_OPTIONS, signal });
    if (!res.ok) throw new Error(`TMDB request failed (${res.status})`);
    return res.json();
};

// Cached GET. Identical requests within 5 minutes share one network call.
// Pass { cache: false } for things like search, and { signal } to cancel uncached requests.
export const tmdbGet = (path, { signal, cache: useCache = true } = {}) => {
    const url = `${API_BASE_URL}${path}`;
    if (!useCache) return request(url, signal);

    const hit = cache.get(url);
    if (hit && Date.now() - hit.time < CACHE_TTL) return hit.promise;

    const promise = request(url).catch((error) => {
        cache.delete(url);
        throw error;
    });
    cache.set(url, { promise, time: Date.now() });
    return promise;
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
    if (!key || typeof key !== 'string') return null;
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

export const SORT_OPTIONS = [
    { value: 'popular', label: 'Most popular' },
    { value: 'rating', label: 'Top rated' },
    { value: 'newest', label: 'Newest' },
];

// sort and year only work on discover-based lists (trending and top-rated are fixed by TMDB)
export const canFilter = (cfg) => !!cfg && cfg.path.startsWith('/discover');

export const fetchCategory = async (key, page = 1, { sort = 'popular', year = '' } = {}) => {
    const c = getCategory(key);
    if (!c) throw new Error('Unknown category');

    const params = new URLSearchParams(c.params || '');
    params.set('page', String(page));

    if (canFilter(c)) {
        const isMovie = c.type === 'movie';
        const dateField = isMovie ? 'primary_release_date' : 'first_air_date';
        const today = new Date().toISOString().slice(0, 10);

        if (sort === 'rating') {
            params.set('sort_by', 'vote_average.desc');
            params.set('vote_count.gte', '200');
        } else if (sort === 'newest') {
            params.set('sort_by', `${dateField}.desc`);
            params.set(`${dateField}.lte`, today);
            params.set('vote_count.gte', '5');
        }

        if (year) {
            params.set(isMovie ? 'primary_release_year' : 'first_air_date_year', String(year));
        }
    }

    const data = await tmdbGet(`${c.path}?${params.toString()}`);
    return { results: data.results || [], totalPages: data.total_pages || 1, type: c.type };
};