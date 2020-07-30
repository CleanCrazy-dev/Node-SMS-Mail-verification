// Request Logging and Libraries
const moment = require('moment');
const RequestLog = require('../models/RequestLog');

// Sends Email using SendGrid
module.exports.writeRequestLog = async (req, res, next) => {
  try {
    let requestTime = Date.now();
    res.on('finish', () => {
      if (req.path === '/ping') {
        return;
      }
      RequestLog.create({
        url: req.path,
        method: req.method,
        responseTime: (Date.now() - requestTime) / 1000, // convert to seconds
        day: moment(requestTime).format('dddd'),
        hour: moment(requestTime).hour(),
      });
    });
    next();
  } catch (error) {
    console.error(err.message);
    next();
  }
};
