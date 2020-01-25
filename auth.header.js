const jwt = require('jsonwebtoken');
// load config for jwt secret
require('dotenv');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decodeToken = jwt.verify(token, process.env.SECRET);
    const { id } = decodeToken;

    if (+id && +id !== +req.headers.id) {
      return res.status(401).send({
        status: 'error',
        error: 'token mismatch',
        body: req.body,
      });
    }
    next();
  } catch (error) {
    res.status(500).send({
      status: 'error',
      error,
    });
  }
};