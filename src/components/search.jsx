import React from 'react'

const Search = ({ searchTerm, setSearchTerm, inputRef }) => {
    return (
        <div className="search">
            <div>
                <img src="/search.svg" alt="" aria-hidden="true" />

                <input
                    ref={inputRef}
                    type="text"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    aria-label="Search movies and TV shows"
                    placeholder="Search through thousands of movies"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setSearchTerm('')
                    }}
                />

                {searchTerm ? (
                    <button
                        type="button"
                        onClick={() => setSearchTerm('')}
                        aria-label="Clear search"
                        className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full text-light-200 hover:text-white hover:bg-white/10 transition"
                    >
                        ✕
                    </button>
                ) : (
                    <kbd
                        aria-hidden="true"
                        className="pointer-events-none absolute right-3 hidden sm:grid place-items-center w-6 h-6 rounded-md border border-white/20 text-xs text-light-200 [@media(pointer:coarse)]:hidden"
                    >
                        /
                    </kbd>
                )}
            </div>
        </div>
    )
}

export default Search