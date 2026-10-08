import React, { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import Search from "./components/search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import MovieDetail from "./components/MovieDetail.jsx";
import { useDebounce } from 'react-use'
import { updateSearchCount } from "./appwrite.js";

const API_BASE_URL = 'https://api.themoviedb.org/3';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`,
  }
}

const Home = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [movieList, setMovieList] = useState([]);
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");

  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async () => {
    try {
      const response = await fetch(
          `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`,
          API_OPTIONS
      );

      const data = await response.json();

      setMovieList(data.results || []);
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage(`Error fetching movies. Please try again later`);
    }
  };

  const searchMovies = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    setSearchError("");

    try {
      const response = await fetch(
          `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`,
          API_OPTIONS
      );

      const data = await response.json();

      setSearchResults(data.results || []);

      if (data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }

    } catch (error) {
      console.error(`Error searching movies: ${error}`);
      setSearchError("Search failed. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const response = await fetch(
          `${API_BASE_URL}/trending/movie/day`,
          API_OPTIONS
      );

      const data = await response.json();

      setTrendingMovies(data.results.slice(0, 10));

    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  useEffect(() => {
    searchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
      <main>
        <div className="pattern" />

        <div className="layout">

          {/* LEFT MAIN AREA */}
          <div className="main-area">

            <header>
              <img src="./hero.png" alt="hero.png" />

              <h1>
                Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle
              </h1>
            </header>

            {trendingMovies.length > 0 && (
                <section className="trending">
                  <h2>Trending Movies</h2>

                  <ul>
                    {trendingMovies.map((movie, index) => (
                        <li key={movie.id}>
                          <p>{index + 1}</p>

                          <img
                              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                              alt={movie.title}
                          />
                        </li>
                    ))}
                  </ul>
                </section>
            )}

            {/* ALL MOVIES */}
            <section className="all-movies">
              <h2>All Movies</h2>

              {errorMessage ? (
                  <p className="text-red-500">{errorMessage}</p>
              ) : (
                  <ul className="flex overflow-x-auto gap-6 scroll-smooth hide-scrollbar py-4">
                    {movieList.map((movie) => (
                        <li
                            key={movie.id}
                            className="min-w-[220px] max-w-[220px] flex-shrink-0"
                        >
                          <MovieCard movie={movie} />
                        </li>
                    ))}
                  </ul>
              )}
            </section>
          </div>

          {/* RIGHT SIDEBAR */}
          <div className="sidebar">

            <Search
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
            />

            <div className="search-results">

              {searchLoading ? (
                  <Spinner />

              ) : searchError ? (
                  <p className="text-red-500">{searchError}</p>

              ) : searchResults.length > 0 ? (

                  <ul className="flex overflow-x-auto gap-6 scroll-smooth hide-scrollbar py-4">

                    {searchResults.map((movie) => (
                        <li
                            key={movie.id}
                            className="min-w-[220px] max-w-[220px] flex-shrink-0"
                        >
                          <MovieCard movie={movie} />
                        </li>
                    ))}

                  </ul>

              ) : debouncedSearchTerm ? (

                  <p className="text-gray-100">
                    No results found for "{debouncedSearchTerm}"
                  </p>

              ) : (

                  <p className="text-gray-100 mt-4">
                    Search for a movie...
                  </p>

              )}

            </div>
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
      </Routes>
  )
}

export default App