# Ticket Booking Mock API

A mock API server for a ticket booking platform built with Node.js and Express.js.

## Features

- Movie management
- Theater management
- Show times
- Seat booking system
- User authentication
- QR code generation for tickets
- Cast and crew information

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mock-api
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3001`

## API Endpoints

### Movies
- GET `/movies` - Get all movies
- GET `/movies/:id` - Get movie by ID
- POST `/movies` - Create new movie
- PUT `/movies/:id` - Update movie
- DELETE `/movies/:id` - Delete movie

### Bookings
- GET `/bookings` - Get all bookings
- POST `/bookings` - Create new booking
- GET `/bookings/:id` - Get booking by ID

### Users
- GET `/users` - Get all users
- POST `/users` - Create new user
- POST `/auth/login` - User login

### Theaters
- GET `/theaters` - Get all theaters
- POST `/theaters` - Create new theater

### Show Times
- GET `/showtimes` - Get all show times
- POST `/showtimes` - Create new show time

### Seats
- GET `/seats/:showtimeId` - Get seat layout for show time
- POST `/seats/book` - Book seats

## Project Structure

```
├── server.cjs           # Main server file
├── db.cjs              # Database configuration
├── package.json        # Project dependencies
├── controllers/        # API controllers
│   ├── auth.cjs
│   ├── bookings.cjs
│   ├── movies.cjs
│   ├── users.cjs
│   └── ...
├── db/                 # Database models/schemas
│   ├── movies.cjs
│   ├── bookings.cjs
│   ├── users.cjs
│   └── ...
└── router/            # Route definitions
    └── router.cjs
```

## Technologies Used

- Node.js
- Express.js
- LowDB (for data persistence)
- QR Code generation
- CORS middleware

## Development

To run in development mode:
```bash
npm run dev
```

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
