// bcrypt for password hash verification
const bcrypt = require('bcrypt');
// json web token for generating jwt tokens
const jwt = require('jsonwebtoken');
// pg for postgres db transactions
const { Pool } = require('pg');
//  cloudinary for cloud file storage
const cloudinary = require('cloudinary');
// dotenv for including .env file
const dotenv = require('dotenv');

// datauri for converting gif image to a string
const Datauri = require('datauri');

// path
const path = require('path');

// instantiate datauri
const dUri = new Datauri();

// convert buffer to data url

const dataUri = (req) => dUri.format(path.extname(req.file.originalname).toString(),
  req.file.buffer);

// require .env
dotenv.config();

// pool of connections to avoid re-connections to postgres with each request
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PORT,
});

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// query error handling
const queryError = (error, status, res) => {
  if (error) {
    return res.status(status).send({
      status: 'error',
      error,
    });
  }
};

// admin login
const adminLogin = (req, res) => {
  pool.query('SELECT password,id FROM admin WHERE email = $1', [req.body.email], (error, result) => {
    // error handling
    queryError(error, 500, res);

    bcrypt.compare(req.body.password, result.rows[0].password).then(
      (status) => {
        if (!status) {
          queryError('admin password mismatch', 301, res);
        }
        // sign jw token
        const token = jwt.sign({ adminId: result.rows[0].id }, 'SECRET', { expiresIn: '24h' });

        return res.status(200).json({
          status: 'success',
          data: token,
        });
      },
    ).catch((error1) => {
      queryError(error1, 500, res);
    });
  });
};

module.exports = {
  adminLogin
}