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
  connectionString: process.env.DATABASE_URL,
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
    return res.status(status).json({
      status: 'error',
      error,
    });
  }
};

// admin login
const adminLogin = (req, res) => {
  // retrieve the req details
  pool.query('SELECT password,id FROM admin WHERE email = $1', [req.body.email],
    (error, result) => {
      // handle error
      queryError(error, 500, res);
      // compare password
      bcrypt.compare(req.body.password, result.rows[0].password, (error1, match) => {
        // handle error
        queryError(error1, 500, res);
        // if password match
        if (match) {
          // sign token
          const token = jwt.sign({ id: result.rows[0].id }, 'SECRET', { expiresIn: '24h' });
          // respond with success status and a token
          return res.status(200).send({
            status: 'success',
            data: token,
          });
        }
        // else send password mismatch error
        queryError('password mismatch', 200, res);
      });
    });
};

// admin create employee
const adminCreateEmployee = (req, res) => {
  // validate req details
  if (req.body.id !== 'undefined' && req.body.email !== 'undefined' && req.body.name !== 'undefined' && req.body.password !== 'undefined') {
    bcrypt.hash(req.body.password, 10, (error, hash) => {
      // handle error
      queryError(error, 500, res);
      // insert user to db
      pool.query('INSERT INTO employees (name, email, password) VALUES ($1, $2, $3)',
        [req.body.name, req.body.email, hash], (error1) => {
          // handle error
          queryError(error1, 500, res);
        });
      // respond with success
      return res.status(200).send({
        status: 'success',
        data: {
          message: 'employee added successfully',
        },
      });
    });
  } else {
    // else respond with invalid details error
    queryError('invalid details', 200, res);
  }
};

// client fetch specific employee
const getSpecificEmployee = (req, res) => {
  pool.query('SELECT id, name, email FROM employees WHERE id = $1', [req.params.id],
    (error, result) => {
      // handle error
      queryError(error, 500, res);
      return res.status(200).json({
        status: 'success',
        data: result.rows[0],
      });
    });
};

// employee login
const employeeLogin = (req, res) => {
  // validate data
  if (req.body.email !== 'undefined' && req.body.password !== 'undefined') {
    pool.query('SELECT password,id,name FROM employees WHERE email = $1', [req.body.email], (error, result) => {
      // error handling
      queryError(error, 500, res);
      // if user exists
      if (result.rows.length >= 1) {
        // verify password
        bcrypt.compare(req.body.password, result.rows[0].password).then(
          (status) => {
            if (!status) {
              return res.status(301).send({
                status: 'error',
                error: 'employee password mismatch',
              });
            }
            // sign jw token
            const token = jwt.sign({ id: result.rows[0].id }, 'SECRET', { expiresIn: '24h' });

            return res.status(200).send({
              status: 'success',
              data: token,
              id: result.rows[0].id,
              userName: result.rows[0].name,
            });
          },
        ).catch((error1) => res.status(500).send({
          status: 'error',
          error: error1,
        }));
      } else {
        return res.status(200).send({
          status: 'error',
          error: 'employee not in records',
        });
      }
    });
  } else {
    queryError('invalid details', 200, res);
  }
};

// employee post an article
const employeePostArticle = (req, res) => {
  // validate data
  if (req.body.id !== 'undefined' && req.body.title !== 'undefined' && req.body.body !== 'undefined' && req.body.category !== 'undefined') {
    pool.query('INSERT INTO articles (employee_id, title, body, category) VALUES ($1,$2,$3,$4)',
      [req.body.id, req.body.title, req.body.body, req.body.category], (error) => {
        if (error) {
          return res.status(500).json({
            status: 'error',
            error,
          });
        }
        return res.status(200).send({
          status: 'success',
          data: {
            message: 'article added successfully',
          },
        });
      });
  } else {
    queryError('invalid details', 200, res);
  }
};

// employee edit article
const employeeEditArticle = (req, res) => {
  let id;
  // confirm employee owns aricle
  pool.query('SELECT employee_id FROM articles WHERE id = $1', [req.params.id], (error, result) => {
    // error handling
    queryError(error, 500, res);
    id = result.rows[0].employee_id;
    // confirm ownership of article
    if (id && +id !== +req.body.id) {
      return res.status(419).send({
        status: 'error',
        error: 'unauthorized to edit this article',
      });
    }
    // validate data
    if (req.body.title !== 'undefined' && req.body.body !== 'undefined' && req.body.category !== 'undefined') {
      pool.query('UPDATE articles SET title=$1, body=$2, category=$3 WHERE id=$4', [req.body.title,
        req.body.body, req.body.category, req.params.id], (error) => {
        // error handling
        queryError(error, 500, res);

        return res.status(200).send({
          status: 'success',
          data: {
            message: 'article updated successfully',
            id: req.params.id,
          },
        });
      });
    } else {
      queryError('invalid details', 200, res);
    }
  });
};

// employee delete article
const employeeDeleteArticle = (req, res) => {
  let id;
  // confirm employee owns aricle
  pool.query('SELECT employee_id FROM articles WHERE id = $1', [req.params.id], (error, result) => {
    // error handling
    queryError(error, 500, res);
    id = result.rows[0].employee_id;
    // confirm ownership
    if (id && +id !== +req.headers.id) {
      return res.status(419).send({
        status: 'error',
        error: 'unathorized to delete this article',
      });
    }
    pool.query('DELETE FROM articles WHERE id=$1', [req.params.id], (error1) => {
      // error handling
      queryError(error1, 500, res);
      return res.status(200).send({
        status: 'success',
        data: {
          message: 'article deleted successfully',
          id: 1,
        },
      });
    });
  });
};

// employee comments on article
const employeeCommentsOnArticle = (req, res) => {
  // validate data
  if (req.body.id !== 'undefined' && req.body.comment !== 'undefined') {
    pool.query('INSERT INTO comments (article_id, employee_id, comment) VALUES ($1,$2,$3)',
      [req.params.id, req.body.id, req.body.comment], (error) => {
        // handle query error
        queryError(error, 500, res);
        return res.status(200).send({
          status: 'success',
          data: {
            message: 'article comment added successfully',
            articleId: req.params.id,
          },
        });
      });
  } else {
    queryError('invalid details', 200, res);
  }
};

// employee can view all comments of an article
const employeeViewAllCommentsOfAnArticle = (req, res) => {
  pool.query('SELECT * FROM comments ORDER BY created_at DESC', (error, result) => {
    // handle error
    queryError(error, 500, res);
    return res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  });
};


// employee can view all articles
const employeeCanViewAllArticles = (req, res) => {
  if (req.query.page) {
    const offset = req.query.page === 1 ? 0 : 5 * (req.query.page - 1);
    pool.query(`SELECT * FROM articles ORDER BY created_at DESC LIMIT 5 OFFSET ${offset}`, (error, result) => {
      // handle query error
      queryError(error, 500, res);
      if (result.length <= 0) {
        return res.status(200).send({
          status: 'success',
          data: 'no articles',
        });
      }
      return res.status(200).send({
        status: 'success',
        data: result.rows,
      });
    });
  } else {
    pool.query('SELECT * FROM articles ORDER BY created_at DESC ', (error, result) => {
      // handle query error
      queryError(error, 500, res);
      if (result.length <= 0) {
        return res.status(200).send({
          status: 'success',
          data: 'no articles',
        });
      }
      return res.status(200).send({
        status: 'success',
        data: result.rows,
      });
    });
  }
};

// employee can view a specific article
const employeeCanViewSpecificArticle = (req, res) => {
  pool.query('SELECT * FROM articles WHERE id=$1', [req.params.id], (error, result) => {
    // handle query error
    queryError(error, 500, res);
    return res.status(200).send({
      status: 'success',
      data: result.rows[0],
    });
  });
};

// employee upload gif
const employeeUploadGif = (req, res) => {
  // convert gif to blob
  const gif = dataUri(req).content;

  cloudinary.v2.uploader.upload(gif, (error, result) => {
    // handle error
    queryError(error, 500, res);

    pool.query('INSERT INTO gifs (employee_id,url) VALUES($1,$2)', [req.body.id, result.secure_url],
      (error1) => {
        // handle error from node-postgress
        queryError(error1, 500, res);

        return res.status(200).send({
          status: 'success',
          data: {
            public_id: result.public_id,
            message: 'gif added successfully',
          },
        });
      });
  });
};

// employee delete gif
const employeeDeleteGif = (req, res) => {
  let id;
  pool.query('SELECT employee_id FROM gifs WHERE id = $1', [req.params.id], (error, result) => {
    // handle error
    queryError(error, 500, res);
    id = result.rows[0].employee_id;
    // confirm ownership
    if (id && +id !== +req.headers.id) {
      return res.status(419).send({
        status: 'error',
        error: 'unathorized to delete this gif',
      });
    }
    pool.query('DELETE FROM gifs WHERE id=$1', [req.params.id], (error) => {
      // handle error
      queryError(error, 500, res);

      return res.status(200).send({
        status: 'success',
        data: {
          message: 'gif deleted successfully',
        },
      });
    });
  });
};

// employee comment on gif
const employeeCommentGif = (req, res) => {
  // validate data
  if (req.body.id !== 'undefined' && req.body.comment !== 'undefined') {
    pool.query('INSERT INTO gif_comments (gif_id, employee_id, comment) VALUES($1,$2,$3)',
      [req.params.id, req.body.id, req.body.comment], (error) => {
        // handle error
        queryError(error, 500, res);

        return res.status(200).send({
          status: 'success',
          data: {
            message: 'gif comment added successfully',
          },
        });
      });
  } else {
    queryError('invalid details', 200, res);
  }
};

// employee can view all comments of a gif
const employeeViewAllCommentsOfGif = (req, res) => {
  pool.query('SELECT * FROM gif_comments ORDER BY created_at DESC', (error, result) => {
    // handle error
    queryError(error, 500, res);
    return res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  });
};

// employee can view all gifs
const employeeViewAllGifs = (req, res) => {
  if (req.query.page) {
    const offset = req.query.page === 1 ? 0 : 5 * (req.query.page - 1);
    pool.query(`SELECT * FROM gifs ORDER BY created_at DESC LIMIT 5 OFFSET ${offset}`, (error, result) => {
      // handle error
      queryError(error, 500, res);

      return res.status(200).send({
        status: 'success',
        data: result.rows,
      });
    });
  } else {
    pool.query('SELECT * FROM gifs ORDER BY created_at DESC', (error, result) => {
      // handle error
      queryError(error, 500, res);

      return res.status(200).send({
        status: 'success',
        data: result.rows,
      });
    });
  }
};

// employee view specific gif
const employeeViewSpecificGif = (req, res) => {
  pool.query('SELECT * FROM gifs WHERE id = $1', [req.params.id], (error, result) => {
    // handle error
    queryError(error, 500, res);

    return res.status(200).send({
      status: 'success',
      data: result.rows[0],
    });
  });
};

// employee view feed i.e both gifs & articles
const employeeViewFeed = (req, res) => {
  let feed;
  if (req.query.page) {
    const offset = req.query.page === 1 ? 0 : 2 * (req.query.page - 1);
    // query all gifs
    pool.query(`SELECT * FROM gifs ORDER BY created_at DESC  LIMIT 2 OFFSET ${offset}`, (error1, result1) => {
      // handle error
      queryError(error1, 500, res);
      const gifs = result1.rows;
      // query all articles
      pool.query(`SELECT * FROM articles ORDER BY created_at DESC  LIMIT 2 OFFSET ${offset} `, (error2, result2) => {
        // handle error
        queryError(error2, 500, res);
        const articles = result2.rows;
        feed = gifs.concat(articles);
        return res.status(200).send({
          status: 'success',
          data: feed,
        });
      });
    });
  } else {
    // query all gifs
    pool.query('SELECT * FROM gifs ORDER BY created_at DESC ', (error1, result1) => {
      // handle error
      queryError(error1, 500, res);
      const gifs = result1.rows;
      // query all articles
      pool.query('SELECT * FROM articles ORDER BY created_at DESC ', (error2, result2) => {
        // handle error
        queryError(error2, 500, res);
        const articles = result2.rows;
        feed = gifs.concat(articles);
        return res.status(200).send({
          status: 'success',
          data: feed,
        });
      });
    });
  }
};

// catch any wild(don't match any endpoint) GET requests
const getWildRequests = (req, res) => res.status(200).json({
  status: 'success',
  data: {
    message: 'Your request did not match any path in the api',
  },
});

// catch any wild(don't match any endpoint) POST requests
const postWildRequests = (req, res) => res.status(200).json({
  status: 'success',
  data: {
    message: 'Your request did not match any path in the api',
  },
});

module.exports = {
  adminLogin,
  adminCreateEmployee,
  getSpecificEmployee,
  employeeLogin,
  employeePostArticle,
  employeeEditArticle,
  employeeDeleteArticle,
  employeeCommentsOnArticle,
  employeeCanViewAllArticles,
  employeeCanViewSpecificArticle,
  employeeUploadGif,
  employeeDeleteGif,
  employeeCommentGif,
  employeeViewAllGifs,
  employeeViewSpecificGif,
  employeeViewFeed,
  getWildRequests,
  postWildRequests,
  employeeViewAllCommentsOfGif,
  employeeViewAllCommentsOfAnArticle,
};
