const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const hereApi = require('../../helpers/hereApi');
const EmailLog = require('./../../models/EmailLog');

const { check, validationResult } = require('express-validator');

// @route    POST /v1/services/autosuggest
// @desc     Performs a query to check address
// @access   Public
router.post(
  '/autosuggest',
  [check('q', i18n.__n('services_autosuggest_query_required')).exists()],
  async (req, res, next) => {
    try {
      const validationErrors = validationResult(req);
      if (!validationErrors.isEmpty()) {
        return res
          .status(400)
          .json({ statusCode: 401, errors: validationErrors.array() });
      }

      const { q, lat, long, locale } = req.body;

      let returnObject = hereApi.autoSuggest(q, lat, long, locale);
      returnObject.then((suggestions) => {
        if (suggestions === null) {
          res.status(400).json({
            statusCode: 400,
            errors: [
              { msg: 'Could not locate results', errorCode: 'noResults' },
            ],
          });
        } else {
          res.status(200).json({ statusCode: 200, data: suggestions });
        }
      });
    } catch (err) {
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
      });
    }
  }
);

module.exports = router;
