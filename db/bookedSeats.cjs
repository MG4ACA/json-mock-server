const bookedSeats = [
  // Booking 1001: theater_id: 1, movie_id: 101, showtime_id: 7
  {
    id: 1,
    booking_id: 1001,
    seat_number: "A11",
    theater_movie_showtime_key: 1007101, // theater_id + showtime_id + movie_id
    seat_price: 1200.0,
    seat_id: 1,
    created_at: "2025-05-25T10:00:00Z",
  },
  {
    id: 2,
    booking_id: 1001,
    seat_number: "A12",
    theater_movie_showtime_key: 1007101,
    seat_price: 1200.0,
    seat_id: 2,
    created_at: "2025-05-25T10:00:00Z",
  },

  // Booking 1002: theater_id: 2, movie_id: 102, showtime_id: 9
  {
    id: 3,
    booking_id: 1002,
    seat_number: "B21",
    theater_movie_showtime_key: 2009102,
    seat_price: 1000.0,
    seat_id: 3,
    created_at: "2025-05-25T10:00:00Z",
  },
  {
    id: 4,
    booking_id: 1002,
    seat_number: "B22",
    theater_movie_showtime_key: 2009102,
    seat_price: 1000.0,
    seat_id: 4,
    created_at: "2025-05-25T10:00:00Z",
  },

  // Booking 1003: theater_id: 1002, movie_id: 101, showtime_id: 4 (this is what we're testing)
  {
    id: 5,
    booking_id: 1003,
    seat_number: "A11", // Section A, Row 1, Seat 1
    theater_movie_showtime_key: 10024101, // theater_id: 1002, showtime_id: 4, movie_id: 101
    seat_price: 1500.0, // VIP Section price
    seat_id: 5,
    created_at: "2025-07-14T10:00:00Z",
  },
  {
    id: 6,
    booking_id: 1003,
    seat_number: "A12", // Section A, Row 1, Seat 2
    theater_movie_showtime_key: 10024101,
    seat_price: 1500.0, // VIP Section price
    seat_id: 6,
    created_at: "2025-07-14T10:00:00Z",
  },

  // Booking 1004: theater_id: 1002, movie_id: 101, showtime_id: 4
  {
    id: 7,
    booking_id: 1004,
    seat_number: "B15", // Section B, Row 1, Seat 5
    theater_movie_showtime_key: 10024101,
    seat_price: 1100.0, // Premium Section price
    seat_id: 7,
    created_at: "2025-07-14T11:00:00Z",
  },
  {
    id: 8,
    booking_id: 1004,
    seat_number: "B16", // Section B, Row 1, Seat 6
    theater_movie_showtime_key: 10024101,
    seat_price: 1100.0, // Premium Section price
    seat_id: 8,
    created_at: "2025-07-14T11:00:00Z",
  },

  // UUID Booking: booking_id: "643f70d0-564f-40e4-ba65-538de03c47cf", theater_id: 1, movie_id: 101, showtime_id: 7
  {
    id: 9,
    booking_id: "643f70d0-564f-40e4-ba65-538de03c47cf",
    seat_number: "C1",
    theater_movie_showtime_key: 1007101, // theater_id + showtime_id + movie_id
    seat_price: 900.0,
    seat_id: 9,
    created_at: "2025-07-21T10:15:00Z",
  },
  {
    id: 10,
    booking_id: "643f70d0-564f-40e4-ba65-538de03c47cf",
    seat_number: "C2",
    theater_movie_showtime_key: 1007101,
    seat_price: 900.0,
    seat_id: 10,
    created_at: "2025-07-21T10:15:00Z",
  },
  {
    id: 11,
    booking_id: "643f70d0-564f-40e4-ba65-538de03c47cf",
    seat_number: "C3",
    theater_movie_showtime_key: 1007101,
    seat_price: 900.0,
    seat_id: 11,
    created_at: "2025-07-21T10:15:00Z",
  },
];

module.exports = { bookedSeats };
