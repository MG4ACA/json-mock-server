// Mock movieCrew junction table: many-to-many relationship between movies and crew with roles
module.exports = [
  // Movie: Galactic Odyssey (movie_id: 101)
  {
    id: 1,
    movie_id: 101,
    crew_id: 1, // Ava Rodriguez
    role: 'Director',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    movie_id: 101,
    crew_id: 2, // John Smith
    role: 'Producer',
    created_at: new Date().toISOString()
  },

  // Movie: Midnight Heist (movie_id: 102)
  {
    id: 3,
    movie_id: 102,
    crew_id: 3, // Jordan Peele
    role: 'Director',
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    movie_id: 102,
    crew_id: 4, // Jane Doe
    role: 'Producer',
    created_at: new Date().toISOString()
  },

  // Movie: The Last Summer (movie_id: 103)
  {
    id: 5,
    movie_id: 103,
    crew_id: 5, // Sophia Coppola
    role: 'Director',
    created_at: new Date().toISOString()
  },
  {
    id: 6,
    movie_id: 103,
    crew_id: 6, // Emily Clark
    role: 'Producer',
    created_at: new Date().toISOString()
  }
];
