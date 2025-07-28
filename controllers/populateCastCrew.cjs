const castData = require('../db/cast.cjs');
const crewData = require('../db/crew.cjs');
const movieCastData = require('../db/movieCast.cjs');
const movieCrewData = require('../db/movieCrew.cjs');

function populateCastCrew(movie) {
  const movieId = movie.movie_id || movie.id;
  
  // Ensure cast and crew data are arrays
  const castArray = Array.isArray(castData) ? castData : [];
  const crewArray = Array.isArray(crewData) ? crewData : [];
  const movieCastArray = Array.isArray(movieCastData) ? movieCastData : [];
  const movieCrewArray = Array.isArray(movieCrewData) ? movieCrewData : [];
  
  // Get cast for this movie from junction table
  const movieCasts = movieCastArray.filter(mc => mc.movie_id === movieId);
  const cast = movieCasts.map(mc => {
    const castMember = castArray.find(c => c.cast_id === mc.cast_id);
    return castMember ? {
      id: castMember.cast_id,
      name: castMember.person_name,
      image: castMember.profile_image_url,
      ...castMember
    } : null;
  }).filter(Boolean);

  // Get crew for this movie from junction table
  const movieCrews = movieCrewArray.filter(mc => mc.movie_id === movieId);
  const crew = movieCrews.map(mc => {
    const crewMember = crewArray.find(c => c.crew_id === mc.crew_id);
    return crewMember ? {
      id: crewMember.crew_id,
      name: crewMember.person_name,
      image: crewMember.profile_image_url,
      role: mc.role,
      ...crewMember
    } : null;
  }).filter(Boolean);

  return {
    ...movie,
    cast,
    crew,
  };
}

module.exports = populateCastCrew;
