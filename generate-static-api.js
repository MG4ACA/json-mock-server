// Script to generate static JSON files for GitHub Pages deployment
const fs = require('fs');
const path = require('path');

// Import your database
const db = require('./db.cjs')();

// Create api directory
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
}

// Generate static JSON files
function generateStaticAPI() {
    // Movies
    fs.writeFileSync(
        path.join(apiDir, 'movies.json'),
        JSON.stringify(db.movies, null, 2)
    );

    // Individual movie files
    const moviesDir = path.join(apiDir, 'movies');
    if (!fs.existsSync(moviesDir)) {
        fs.mkdirSync(moviesDir, { recursive: true });
    }
    
    db.movies.forEach(movie => {
        fs.writeFileSync(
            path.join(moviesDir, `${movie.id}.json`),
            JSON.stringify(movie, null, 2)
        );
    });

    // Theaters
    fs.writeFileSync(
        path.join(apiDir, 'theaters.json'),
        JSON.stringify(db.theaters, null, 2)
    );

    // Show times
    fs.writeFileSync(
        path.join(apiDir, 'showtimes.json'),
        JSON.stringify(db.showTimes, null, 2)
    );

    // Users (for demo - in real app, don't expose user data)
    fs.writeFileSync(
        path.join(apiDir, 'users.json'),
        JSON.stringify(db.users, null, 2)
    );

    // Bookings
    fs.writeFileSync(
        path.join(apiDir, 'bookings.json'),
        JSON.stringify(db.bookings, null, 2)
    );

    // Seat layouts
    fs.writeFileSync(
        path.join(apiDir, 'seats.json'),
        JSON.stringify(db.seatLayout, null, 2)
    );

    // Cast and crew
    fs.writeFileSync(
        path.join(apiDir, 'cast.json'),
        JSON.stringify(db.cast, null, 2)
    );

    fs.writeFileSync(
        path.join(apiDir, 'crew.json'),
        JSON.stringify(db.crew, null, 2)
    );

    // Movie cast relationships
    fs.writeFileSync(
        path.join(apiDir, 'movie-cast.json'),
        JSON.stringify(db.movieCast, null, 2)
    );

    // Movie crew relationships
    fs.writeFileSync(
        path.join(apiDir, 'movie-crew.json'),
        JSON.stringify(db.movieCrew, null, 2)
    );

    console.log('Static API files generated successfully!');
    console.log('Files created in ./api/ directory');
}

generateStaticAPI();
