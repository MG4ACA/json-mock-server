// Utility to populate cast and crew for a movie object
const castData = require('./cast.cjs');
const crewData = require('./crew.cjs');

function populateMovie(movie) {
  return {
    ...movie,
    cast: Array.isArray(movie.cast)
      ? movie.cast.map(id => castData.find(c => c.id === id)).filter(Boolean)
      : [],
    crew: Array.isArray(movie.crew)
      ? movie.crew.map(id => crewData.find(c => c.id === id)).filter(Boolean)
      : [],
  };
}

module.exports = populateMovie;
