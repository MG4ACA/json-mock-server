// router.cjs
module.exports = (server, db) => {
  // Initialize all routes with proper DB instance
  require("../controllers/auth.cjs")(server, db);
  require("../controllers/users.cjs")(server, db);
  require("../controllers/movies.cjs")(server, db);
  require("../controllers/theater.cjs")(server, db);
  require("../controllers/seat.cjs")(server, db);
  require("../controllers/bookings.cjs")(server, db);
  require("../controllers/showTimes.cjs")(server, db);
  require("../controllers/qr.cjs")(server);
};
