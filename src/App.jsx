import React, { useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate, Link } from 'react-router-dom'
import Search from './components/search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import MediaCard from './components/MediaCard.jsx'
import MovieDetail from './components/MovieDetail.jsx'
import Browse from './components/Browse.jsx'
import TVDetail from './components/TVDetail.jsx'
import CategoryRow from './components/CategoryRow.jsx'
import Carousel from './components/Carousel.jsx'
import GenreNav from './components/GenreNav.jsx'
import HeroSlider from './components/HeroSlider.jsx'
import RecentRow from './components/RecentRow.jsx'
import MyList from './components/MyList.jsx'
import { useWatchlist } from './lib/library.js'
import { useDebounce } from 'react-use'
import { updateSearchCount } from './appwrite.js'
import { API_BASE_URL, API_OPTIONS } from './lib/tmdb.js'

const BRAND = 'MovieApp'

const HOME_ROWS = [
  'trending-tv',
  'top-movies',
  'series',
  'anime',
  'anime-movies',
  'kdrama',
  'nollywood',
  'bollywood',
  'upcoming',
  'reality',
]

const Home = () => {
  const navigate = useNavigate()
  const searchRef = useRef(null)
  const { items: savedItems } = useWatchlist()

  const [searchTerm, setSearchTerm] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [movieList, setMovieList] = useState([])
  const [trendingMovies, setTrendingMovies] = useState([])
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [scrolled, setScrolled] = useState(false)

  useDebounce(
      () => setDebouncedSearchTerm(searchTerm),
      500,
      [searchTerm]
  )

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // press "/" anywhere to jump to the search box
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return

      const el = document.activeElement
      const typing =
          el &&
          (el.tagName === 'INPUT' ||
              el.tagName === 'TEXTAREA' ||
              el.tagName === 'SELECT' ||
              el.isContentEditable)
      if (typing) return

      e.preventDefault()
      searchRef.current?.focus()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  // load the home data, cancelled if the page is left
  useEffect(() => {
    const controller = new AbortController()
    const options = { ...API_OPTIONS, signal: controller.signal }

    const fetchMovies = async () => {
      try {
        const response = await fetch(
            `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`,
            options
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        setMovieList(data.results || [])
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Error fetching movies:', error)
        setErrorMessage('Error fetching movies. Please try again later.')
      }
    }

    const loadTrendingMovies = async () => {
      try {
        const response = await fetch(
            `${API_BASE_URL}/trending/movie/day`,
            options
        )
        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const data = await response.json()
        setTrendingMovies((data.results || []).slice(0, 10))
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Error fetching trending movies:', error)
      }
    }

    fetchMovies()
    loadTrendingMovies()

    return () => controller.abort()
  }, [])

  // search: every new term cancels the previous request
  useEffect(() => {
    const controller = new AbortController()
    const { signal } = controller
    const options = { ...API_OPTIONS, signal }
    const trimmedQuery = debouncedSearchTerm.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      return
    }

    const searchMovies = async () => {
      setSearchLoading(true)
      setSearchError('')

      try {
        const encodedQuery = encodeURIComponent(trimmedQuery)

        const [movieResponse, tvResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/search/movie?query=${encodedQuery}&page=1`, options),
          fetch(`${API_BASE_URL}/search/tv?query=${encodedQuery}&page=1`, options),
        ])

        if (!movieResponse.ok || !tvResponse.ok) {
          throw new Error('One or more search requests failed.')
        }

        const [movieData, tvData] = await Promise.all([
          movieResponse.json(),
          tvResponse.json(),
        ])

        if (signal.aborted) return

        const movies = (movieData.results || []).map((item) => ({
          ...item,
          media_type: 'movie',
        }))

        const shows = (tvData.results || []).map((item) => ({
          ...item,
          media_type: 'tv',
        }))

        const combinedResults = [...movies, ...shows].sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0)
        )

        setSearchResults(combinedResults)

        if (movies.length > 0) {
          updateSearchCount(trimmedQuery, movies[0])
        }
      } catch (error) {
        if (error.name === 'AbortError') return
        console.error('Error searching movies and TV:', error)
        setSearchError('Search failed. Please try again.')
        setSearchResults([])
      } finally {
        // an aborted search means a newer one is running, so leave the spinner on
        if (!signal.aborted) setSearchLoading(false)
      }
    }

    searchMovies()

    return () => controller.abort()
  }, [debouncedSearchTerm])

  const searchOpen = searchTerm.trim().length > 0

  return (
      <main>
        <div className="pattern" />

        <div
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-primary/40 backdrop-blur-md'
                    : 'bg-transparent'
            }`}
        >
          {/* logo mark, wide screens only so it never crowds the search bar */}
          <Link
              to="/"
              aria-label={`${BRAND} home`}
              className="hidden xl:flex absolute left-6 top-5 items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent rounded-lg"
          >
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-2 shadow-lg shadow-accent/40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#040813" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <span className="font-bold text-white tracking-tight">{BRAND}</span>
          </Link>

          <div className="max-w-3xl mx-auto px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0 [&_.search]:mt-0">
                <Search
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    inputRef={searchRef}
                />
              </div>

              <Link
                  to="/my-list"
                  aria-label={`My List, ${savedItems.length} saved`}
                  className="relative flex-shrink-0 flex items-center gap-2 h-[52px] px-4 rounded-2xl border border-white/15 bg-primary/60 backdrop-blur-sm text-white hover:border-accent/60 hover:shadow-lg hover:shadow-accent/20 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={savedItems.length ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={savedItems.length ? 'text-accent-2' : ''}>
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span className="hidden sm:inline text-sm font-semibold">My List</span>
                {savedItems.length > 0 && (
                    <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-gradient-to-r from-accent to-accent-2 text-primary text-xs font-bold">
                      {savedItems.length}
                    </span>
                )}
              </Link>
            </div>

            {searchOpen && (
                <div
                    aria-live="polite"
                    className="mt-3 rounded-xl bg-primary/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-accent/10 p-4 h-[calc(100dvh-7rem)] overflow-y-auto hide-scrollbar"
                >
                  {searchLoading ||
                  searchTerm.trim() !== debouncedSearchTerm.trim() ? (
                      <Spinner />
                  ) : searchError ? (
                      <p className="text-red-500">{searchError}</p>
                  ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 p-3 pb-8 [&_.movie-card]:w-full">
                        {searchResults.map((item) => (
                            <div
                                key={`${item.media_type}-${item.id}`}
                                className="relative transition-transform duration-300 ease-out will-change-transform hover:z-20 hover:scale-[1.05]"
                            >
                              {item.media_type === 'tv' ? (
                                  <MediaCard item={item} type="tv" />
                              ) : (
                                  <MovieCard movie={item} />
                              )}
                              <span
                                  className={`pointer-events-none absolute top-2 left-2 z-10 rounded px-2 py-1 text-xs font-semibold ${
                                      item.media_type === 'tv'
                                          ? 'bg-accent-2 text-primary'
                                          : 'bg-black/70 text-white backdrop-blur'
                                  }`}
                              >
                                {item.media_type === 'tv' ? 'TV SERIES' : 'MOVIE'}
                              </span>
                            </div>
                        ))}
                      </div>
                  ) : (
                      <p className="text-gray-100">
                        No results found for "{debouncedSearchTerm.trim()}"
                      </p>
                  )}
                </div>
            )}
          </div>
        </div>

        <div className="h-20" />

        <div className="layout">
          <div className="main-area">
            <HeroSlider />

            {trendingMovies.length > 0 && (
                <section className="trending">
                  <h2 className="flex items-center gap-3">
                    <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-2 shadow-md shadow-accent/50" />
                    <span className="text-gradient">What everyone is watching</span>
                  </h2>

                  <ul className="py-5 [&>li]:relative [&>li]:transition-transform [&>li]:duration-300 [&>li]:ease-out [&>li]:will-change-transform [&>li:hover]:z-20 [&>li:hover~li]:translate-x-5">
                    {trendingMovies.map((movie, index) => (
                        <li
                            key={movie.id}
                            role="link"
                            tabIndex={0}
                            aria-label={`${index + 1}. ${movie.title}`}
                            className="group/poster cursor-pointer rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                            onClick={() => navigate(`/movie/${movie.id}`)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') navigate(`/movie/${movie.id}`)
                            }}
                        >
                          <p aria-hidden="true">{index + 1}</p>

                          {movie.poster_path && (
                              <img
                                  src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className="origin-left transition-transform duration-300 ease-out group-hover/poster:scale-[1.15]"
                              />
                          )}
                        </li>
                    ))}
                  </ul>
                </section>
            )}

            <RecentRow />

            <section className="all-movies">
              <h2 className="flex items-center gap-3">
                <span aria-hidden="true" className="inline-block w-1 h-6 rounded-full bg-gradient-to-b from-accent to-accent-2 shadow-md shadow-accent/50" />
                <span className="text-gradient">All Movies</span>
              </h2>

              {errorMessage ? (
                  <p className="text-red-500">{errorMessage}</p>
              ) : (
                  <Carousel roomy className="gap-6">
                    {movieList.map((movie) => (
                        <div
                            key={movie.id}
                            className="flex-shrink-0"
                        >
                          <MovieCard movie={movie} expand />
                        </div>
                    ))}
                  </Carousel>
              )}
            </section>

            <GenreNav />

            {HOME_ROWS.map((category) => (
                <CategoryRow
                    key={category}
                    category={category}
                />
            ))}
          </div>
        </div>
      </main>
  )
}

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetail />} />
        <Route path="/browse/:category" element={<Browse />} />
        <Route path="/tv/:id" element={<TVDetail />} />
        <Route path="/my-list" element={<MyList />} />
      </Routes>
  )
}

export default App