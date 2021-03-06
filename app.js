// express framework for nodejs
const express = require('express');
// body-parser module turns body into manipulate-able format of choice
const bodyParser = require('body-parser');

// express app instance
const app = express();

// endpoint queries
const multer = require('multer');

// configure & instantiate multer
const storage = multer.memoryStorage();
const multerGifHandling = multer({ storage }).single('gif');

// set up swagger-ui-express for live api documentation
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/openapi.json');

// verify employee & admin Authentication
const auth = require('./auth');
const authHeader = require('./auth.header');

// controllers
const db = require('./queries');

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

// set up api live documentation
app.use('/teamwork/v1/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// get specific employee
app.get('/teamwork/v1/employees/:id', db.getSpecificEmployee);

// admin login
app.post('/teamwork/v1/admin/login', db.adminLogin);

// admin create employee
app.post('/teamwork/v1/admin/employees', auth, db.adminCreateEmployee);

// employee sign in
app.post('/teamwork/v1/employees/login', db.employeeLogin);

// employee post article
app.post('/teamwork/v1/articles', auth, db.employeePostArticle);

// employee edit article
app.put('/teamwork/v1/articles/:id', auth, db.employeeEditArticle);

// employee delete article
app.delete('/teamwork/v1/articles/:id', authHeader, db.employeeDeleteArticle);

// employee comments on article
app.post('/teamwork/v1/articles/:id/comments', auth, db.employeeCommentsOnArticle);

// employee view comments on article
app.get('/teamwork/v1/articles/:id/comments', db.employeeViewAllCommentsOfAnArticle);

// employee view all articles
app.get('/teamwork/v1/articles', db.employeeCanViewAllArticles);

// employee view a specific article
app.get('/teamwork/v1/articles/:id', db.employeeCanViewSpecificArticle);

// employee post gif
app.post('/teamwork/v1/gifs', multerGifHandling, auth, db.employeeUploadGif);

// employee delete a gif
app.delete('/teamwork/v1/gifs/:id', authHeader, db.employeeDeleteGif);

// employee comments on gif
app.post('/teamwork/v1/gifs/:id/comments', auth, db.employeeCommentGif);

// employee view comments on gif
app.get('/teamwork/v1/gifs/:id/comments', db.employeeViewAllCommentsOfGif);

// employee view all gifs
app.get('/teamwork/v1/gifs/', db.employeeViewAllGifs);

// employee view a specific gif
app.get('/teamwork/v1/gifs/:id', db.employeeViewSpecificGif);

// employee view feed
app.get('/teamwork/v1/feed', db.employeeViewFeed);

// catch wild (don't match any endpoint) POST requests
app.post('/teamwork/v1/*', auth, db.getWildRequests);

// catch wild (don't match any endpoint) GET requests
app.get('/teamwork/v1/*', db.getWildRequests);

// export the app
module.exports = app;
