// server.js
const jsonServer = require("json-server");
const server = jsonServer.create();
const router = jsonServer.router(require("./db.cjs")()); // Initialize with empty DB

// Middleware
server.use(jsonServer.defaults());
server.use(jsonServer.bodyParser);

// Load routes
require("./router/router.cjs")(server, router.db);

// Start server
server.listen(3001, () => console.log("Running on http://localhost:3001"));
