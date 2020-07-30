const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const hereApi = require('../../helpers/hereApi');
const EmailLog = require('./../../models/EmailLog');
const Country = require('./../../models/Country');
const CountriesStatesCities = require('./../../models/CountriesStatesCities');
const Cities = require('../../models/Cities');

const { check, validationResult } = require('express-validator');

/***********
 * Route Points
 * POST   /event/emailLog
 */

// @route    POST /v1/event/emailLog
// @desc     Write SendGrid Mail Log
// @access   Public
router.post('/emailLog', [], async (req, res, next) => {
  try {
    var events = req.body;
    events.forEach(function (event) {
      // Here, you now have each event and can process them how you like
      eventTimestamp = Date('d-M-Y H:i:s a', event.timestamp);
      const log = {
        email: event.email,
        timestamp: this.eventTimestamp,
        smtpId: event.smtp_id,
        event: event.event,
        userAgent: event.useragent,
        ip: event.ip,
        sgEventId: event.sg_event_id,
        sgMessageId: event.sg_message_id,
        reason: event.reason,
        status: event.status,
        response: event.response,
        tls: event.tls,
        url: event.url,
        attempt: event.attempt,
        category: event.category,
        bounceType: event.type,
        asmGroupId: event.asm_group_id,
      };
      const sgMessageId = event.sg_message_id.split('.', 1);
      // Save Log Entry
      EmailLog.findOneAndUpdate(
        { x_message_id: sgMessageId[0] },
        { $push: { eventList: log } },
        { safe: true, upsert: true },
        function (err) {
          // Handle err
          if (err) {
            return next(err);
          }
          return res.end('Success');
        }
      );
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      statusCode: 500,
      errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
    });
  }
});

module.exports = router;
