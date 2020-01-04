// express framework for nodejs
const express = require('express');
// body-parser module turns body into manipulate-able format of choice
const bodyParser = require('body-parser');

// express app instance
const app = express();

// endpoint queries
const multer = require('multer');
const db = require('./queries');

// verify employee Authentication
const employeeAuth = require('./auth.employee');

// configure & instantiate multer
const storage = multer.memoryStorage();
const multerGifHandling = multer({ storage }).single('gif');

/*
setting up cors to allow access to our api
by clients from a different host
*/
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept,Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// support json encoded body
app.use(bodyParser.json());

// support urlencoded body
app.use(bodyParser.urlencoded({ extended: true }));


// admin login
app.post('/teamwork/v1/admin/login', db.adminLogin);

// admin create employee
app.post('/teamwork/v1/admin/employees', db.adminCreateEmployee);

// employee sign in
app.post('/teamwork/v1/employees/login', db.employeeLogin);

// export the app
module.exports = app;
