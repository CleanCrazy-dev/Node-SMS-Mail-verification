const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    x_message_id:{type:String},
    eventList:{type:Array}
  }
);

const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = EmailLog;
