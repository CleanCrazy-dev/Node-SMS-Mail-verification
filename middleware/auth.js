const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({
      statusCode: 401,
      errors: { msg: 'No token, authorization denied.', errorCode: 'noToken' },
    });
  }

  // Verify token
  try {
    jwt.verify(token, config.get('jwtSecret'), (error, decoded) => {
      if (error) {
        return res.status(401).json({
          statusCode: 401,
          errors: { msg: 'Token is not valid', errorCode: 'invalidToken' },
        });
      } else {
        req.user = decoded.user;
        next();
      }
    });
  } catch (err) {
    console.error('something wrong with auth middleware');
    return res.status(500).json({
      statusCode: 500,
      errors: { msg: 'Server Error', errorCode: 'serverError' },
    });
  }
};
