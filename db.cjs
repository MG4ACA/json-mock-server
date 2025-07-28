// mock-api/db.cjs
const { movieList, upcomingMovies, carosalMovies } = require("./db/movies.cjs");
const { users } = require("./db/users.cjs");
const { theaterList } = require("./db/theater.cjs");
const { seatLayoutList } = require("./db/seatLayout.cjs");
const { bookings } = require("./db/bookings.cjs");
const { bookedSeats } = require("./db/bookedSeats.cjs");
const { showTimes } = require("./db/showTimes.cjs");
const cast = require("./db/cast.cjs");
const crew = require("./db/crew.cjs");
const movieCast = require("./db/movieCast.cjs");
const movieCrew = require("./db/movieCrew.cjs");

module.exports = () => {
  return {
    movieList: movieList || [],
    upcomingMovies: upcomingMovies || [],
    users: users || [],
    otpStorage: {},
    carosalMovies: carosalMovies || [],
    theaterList,
    seatLayoutList,
    bookings: bookings || [],
    bookedSeats,
    showTimes,
    cast: cast || [],
    crew: crew || [],
    movieCast: movieCast || [],
    movieCrew: movieCrew || [],
  };
};
