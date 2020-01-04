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
    return res.status(status).json({
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

// admin can create an employee
const adminCreateEmployee = (req, res) => {
  bcrypt.hash(req.body.password, 10, (error, hash) => {
    queryError(error, 500, res);

    pool.query('INSERT INTO employees (name ,email, password) VALUES ($1, $2, $3)',
      [req.body.name, req.body.email, hash], (error1) => {
      // error handling
        queryError(error1, 500, res);

        return res.status(200).json({
          status: 'success',
          data: {
            message: 'employee added successfully',
          },
        });
      });
  });
};

// employee login
const employeeLogin = (req, res) => {
  pool.query('SELECT password,id FROM employees WHERE email = $1', [req.body.email], (error, result) => {
    // error handling
    queryError(error, 500, res);
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
        const token = jwt.sign({ employeeId: result.rows[0].id }, 'SECRET', { expiresIn: '24h' });

        return res.status(200).send({
          status: 'success',
          data: token,
        });
      },
    ).catch((error1) => res.status(500).send({
      status: 'error',
      error: error1,
    }));
  });
};

// employee post an article
const employeePostArticle = (req, res) => {
  pool.query('INSERT INTO articles (employee_id, title, body, category) VALUES ($1,$2,$3,$4)',
    [req.body.id, req.body.title, req.body.body, req.body.category], (error) => {
      queryError(error, 401, res);

      res.status(200).send({
        status: 'success',
        data: {
          message: 'article added successfully',
        },
      });
    });
};

// employee edit article
const employeeEditArticle = (req, res) => {
  let id;
  // confirm employee owns aricle
  pool.query('SELECT employee_id FROM articles WHERE id = $1', [req.params.id], (error, result) => {
    // error handling
    queryError(error, 500, res);
    id = result.rows[0].employee_id;
  });

  if (id && id !== req.body.id) {
    res.status(419).send({
      status: 'error',
      error: 'unathorized to edit this article',
    });
  }

  pool.query('UPDATE articles SET title=$1, body=$2, category=$3 WHERE id=$4', [req.body.title,
    req.body.body, req.body.category, req.params.id], (error) => {
    // error handling
    queryError(error, 500, res);

    res.status(200).send({
      status: 'success',
      data: {
        message: 'article updated successfully',
        id: req.params.id,
      },
    });
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
  });

  if (id && id !== req.body.id) {
    res.status(419).send({
      status: 'error',
      error: 'unathorized to delete this article',
    });
  }

  pool.query('DELETE FROM articles WHERE id=$1', [req.params.id], (error) => {
    // error handling
    queryError(error, 500, res);

    res.status(200).send({
      status: 'success',
      data: {
        message: 'article deleted successfully',
        id: 1,
      },
    });
  });
};

// employee comments on article
const employeeCommentsOnArticle = (req, res) => {
  pool.query('INSERT INTO comments (article_id, employee_id, comment) VALUES ($1,$2,$3)',
    [req.params.id, req.body.id, req.body.comment], (error) => {
    // handle query error
      queryError(error, 500, res);
      res.status(200).send({
        status: 'success',
        data: {
          message: 'article comment added successfully',
          articleId: req.params.id,
        },
      });
    });
};

// employee can view all articles
const employeeCanViewAllArticles = (req, res) => {
  pool.query('SELECT * FROM articles ORDER BY created_at DESC', (error, result) => {
    // handle query error
    queryError(error, 500, res);
    if (result.length <= 0) {
      res.status(200).send({
        status: 'success',
        data: 'no articles',
      });
    }
    res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  });
};

// employee can view a specific article
const employeeCanViewSpecificArticle = (req, res) => {
  pool.query('SELECT * FROM articles WHERE id=$1', [req.params.id], (error, result) => {
    // handle query error
    queryError(error, 500, res);
    res.status(200).send({
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

        res.status(200).send({
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
  pool.query('DELETE FROM gifs WHERE id=$1', [req.params.id], (error) => {
    // handle error
    queryError(error, 500, res);

    res.status(200).send({
      status: 'success',
      data: {
        message: 'gif deleted successfully',
      },
    });
  });
};

// employee comment on gif
const employeeCommentGif = (req, res) => {
  pool.query('INSERT INTO gif_comments (gif_id, employee_id, comment) VALUES($1,$2,$3)',
    [req.params.id, req.body.id, req.body.comment], (error) => {
    // handle error
      queryError(error, 500, res);

      res.status(200).send({
        status: 'success',
        data: {
          message: 'gif comment added successfully',
        },
      });
    });
};

// employee can view all gifs
const employeeViewAllGifs = (req, res) => {
  pool.query('SELECT * FROM gifs ORDER BY created_at DESC', (error, result) => {
    // handle error
    queryError(error, 500, res);

    res.status(200).send({
      status: 'success',
      data: result.rows,
    });
  });
};

// employee view specific gif
const employeeViewSpecificGif = (req, res) => {
  pool.query('SELECT * FROM gifs WHERE id = $1', [req.params.id], (error, result) => {
    // handle error
    queryError(error, 500, res);

    res.status(200).send({
      status: 'success',
      data: result.rows[0],
    });
  });
};

// employee view feed i.e both gifs & articles
const employeeViewFeed = (req, res) => {
  let feed;
  // query all gifs
  pool.query('SELECT * FROM gifs', (error1, result1) => {
    // handle error
    queryError(error1, 500, res);
    const gifs = result1.rows;
    // query all articles
    pool.query('SELECT * FROM articles', (error2, result2) => {
      // handle error
      queryError(error2, 500, res);
      const articles = result2.rows;
      feed = gifs.concat(articles);
      res.status(200).send({
        status: 'success',
        data: feed,
      });
    });
  });
};

module.exports = {
  adminLogin,
  adminCreateEmployee,
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
};
