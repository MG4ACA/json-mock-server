// Mock movieCast junction table: many-to-many relationship between movies and cast
module.exports = [
  // Movie: Galactic Odyssey (movie_id: 101)
  {
    id: 1,
    movie_id: 101,
    cast_id: 1, // Emma Stone
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    movie_id: 101,
    cast_id: 2, // Denzel Washington
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    movie_id: 101,
    cast_id: 3, // Ryan Gosling
    created_at: new Date().toISOString()
  },

  // Movie: Midnight Heist (movie_id: 102)
  {
    id: 4,
    movie_id: 102,
    cast_id: 4, // Lupita Nyong'o
    created_at: new Date().toISOString()
  },
  {
    id: 5,
    movie_id: 102,
    cast_id: 5, // Tom Hanks
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    movie_id: 102,
    cast_id: 6, // Scarlett Johansson
    created_at: new Date().toISOString()
  },

  // Movie: The Last Summer (movie_id: 103)
  {
    id: 7,
    movie_id: 103,
    cast_id: 7, // Idris Elba
    created_at: new Date().toISOString()
  },
  {
    id: 8,
    movie_id: 103,
    cast_id: 8, // Zendaya
    created_at: new Date().toISOString()
  },
  {
    id: 9,
    movie_id: 103,
    cast_id: 9, // Brad Pitt
    created_at: new Date().toISOString()
  }
];
