let mongoose = require('mongoose');

const requestLogSchema = new mongoose.Schema(
  {
    url: String,
    method: String,
    responseTime: Number,
    day: String,
    hour: Number,
  },
  { timestamps: true }
);

const RequestLog = mongoose.model('RequestLogs', requestLogSchema);

module.exports = RequestLog;
