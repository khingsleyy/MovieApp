
import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import Search from './components/search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import MovieDetail from './components/MovieDetail.jsx'
import Browse from './components/Browse.jsx'
import TVDetail from './components/TVDetail.jsx'
import CategoryRow from './components/CategoryRow.jsx'
import Carousel from './components/Carousel.jsx'
import GenreNav from './components/GenreNav.jsx'
import HeroSlider from './components/HeroSlider.jsx'
import { useDebounce } from 'react-use'
import { updateSearchCount } from './appwrite.js'

const API_BASE_URL = 'https://api.themoviedb.org/3'

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  },
}

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

  const fetchMovies = async () => {
    try {
      const response = await fetch(
          `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`,
          API_OPTIONS
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setMovieList(data.results || [])
    } catch (error) {
      console.error('Error fetching movies:', error)
      setErrorMessage('Error fetching movies. Please try again later.')
    }
  }

  const searchMovies = async (query) => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError('')
      setSearchLoading(false)
      return
    }

    setSearchLoading(true)
    setSearchError('')

    try {
      const encodedQuery = encodeURIComponent(trimmedQuery)

      const [movieResponse, tvResponse] = await Promise.all([
        fetch(
            `${API_BASE_URL}/search/movie?query=${encodedQuery}&page=1`,
            API_OPTIONS
        ),
        fetch(
            `${API_BASE_URL}/search/tv?query=${encodedQuery}&page=1`,
            API_OPTIONS
        ),
      ])

      if (!movieResponse.ok || !tvResponse.ok) {
        throw new Error('One or more search requests failed.')
      }

      const [movieData, tvData] = await Promise.all([
        movieResponse.json(),
        tvResponse.json(),
      ])

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

      if (movieData.results?.length > 0) {
        try {
          await updateSearchCount(trimmedQuery, {
            ...movieData.results[0],
            media_type: 'movie',
          })
        } catch (error) {
          console.error('Error updating search count:', error)
        }
      }
    } catch (error) {
      console.error('Error searching movies and TV:', error)
      setSearchError('Search failed. Please try again.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const response = await fetch(
          `${API_BASE_URL}/trending/movie/day`,
          API_OPTIONS
      )

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data = await response.json()
      setTrendingMovies((data.results || []).slice(0, 10))
    } catch (error) {
      console.error('Error fetching trending movies:', error)
    }
  }

  useEffect(() => {
    fetchMovies()
    loadTrendingMovies()
  }, [])

  useEffect(() => {
    searchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  return (
      <main>
        <div className="pattern" />

        <div
            className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
                scrolled
                    ? 'bg-[#030014]/40 backdrop-blur-md'
                    : 'bg-transparent'
            }`}
        >
          <div className="max-w-3xl mx-auto px-5 py-3">
            <div className="[&_.search]:mt-0">
              <Search
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
              />
            </div>

            {searchTerm && (
                <div className="mt-3 rounded-xl bg-[#030014]/90 backdrop-blur-md border border-white/10 p-4 h-[calc(100vh-7rem)] overflow-y-auto hide-scrollbar">
                  {searchLoading ||
                  searchTerm !== debouncedSearchTerm ? (
                      <Spinner />
                  ) : searchError ? (
                      <p className="text-red-500">{searchError}</p>
                  ) : searchResults.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 p-3 pb-8 [&_.movie-card]:w-full">
                        {searchResults.map((item) => (
                            <div
                                key={`${item.media_type}-${item.id}`}
                                onClick={() =>
                                    navigate(
                                        item.media_type === 'tv'
                                            ? `/tv/${item.id}`
                                            : `/movie/${item.id}`
                                    )
                                }
                                className="relative cursor-pointer transition-transform duration-300 ease-out will-change-transform hover:z-20 hover:scale-[1.05]"
                            >
                              <MovieCard movie={item} />
                              <span className="absolute top-2 left-2 z-10 rounded bg-black/80 px-2 py-1 text-xs text-white">
                                                {item.media_type === 'tv'
                                                    ? 'TV SERIES'
                                                    : 'MOVIE'}
                                            </span>
                            </div>
                        ))}
                      </div>
                  ) : (
                      <p className="text-gray-100">
                        No results found for "{debouncedSearchTerm}"
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
                  <h2>What everyone is watching</h2>

                  <ul className="py-5 [&>li]:relative [&>li]:transition-transform [&>li]:duration-300 [&>li]:ease-out [&>li]:will-change-transform [&>li:hover]:z-20 [&>li:hover~li]:translate-x-5">
                    {trendingMovies.map((movie, index) => (
                        <li
                            key={movie.id}
                            className="group/poster cursor-pointer"
                            onClick={() =>
                                navigate(`/movie/${movie.id}`)
                            }
                        >
                          <p>{index + 1}</p>

                          {movie.poster_path && (
                              <img
                                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                  alt={movie.title || 'Movie poster'}
                                  className="origin-left transition-transform duration-300 ease-out group-hover/poster:scale-[1.15]"
                              />
                          )}
                        </li>
                    ))}
                  </ul>
                </section>
            )}

            <section className="all-movies">
              <h2>All Movies</h2>

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
      </Routes>
  )
}

export default App
