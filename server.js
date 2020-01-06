const http = require('http');
const dotenv = require('dotenv');

// require our env file
dotenv.config();

// our express app instance
const app = require('./app');

// set the port in our app
app.set('port', process.env.API_PORT);

// create an http server instance
const server = http.createServer(app);

// start listening for requests wtth our server
server.listen(process.env.API_PORT);
