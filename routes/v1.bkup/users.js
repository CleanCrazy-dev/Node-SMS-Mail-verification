const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const async = require('async');
const { check, validationResult } = require('express-validator');

const normalize = require('normalize-url');

const User = require('../../models/User');

const validatePhoneNumber = require('validate-phone-number-node-js');
const phoneToken = require('generate-sms-verification-code');
const { sendEmail } = require('../../helpers/sendgrid');

// @route    POST api/users
// @desc     Register user
// @access   Public
router.post(
  '/',
  [
    check('firstName', i18n.__n("users_firstname_required")).not().isEmpty(),
    check('lastName', i18n.__n("users_lastname_required")).not().isEmpty(),
    check('phone', i18n.__n("users_phone_number_required")).not().isEmpty(),
    check('email', i18n.__n("users_valid_email_required")).isEmail(),
    check(
      'password',
      i18n.__n("users_valid_password_required")
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, company, email, phone, password } = req.body;

    if (!validatePhoneNumber.validate(phone)) {
      return res
        .status(400)
        .json({ errors: [{ msg: i18n.__n("users_valid_phone_number_required") }] });
    }

    try {
      let user = await User.findOne({ $or: [{ email }, { phone }] });

      if (user) {
        return res
          .status(400)
          .json({ errors: [{ msg: i18n.__n("users_user_already_exist") }] });
      }

      /*
      const avatar = normalize(
        gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm',
        }),
        { forceHttps: true }
      );
*/
      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm',
      });

      user = new User({
        firstName,
        lastName,
        company,
        email,
        phone,
        avatar,
        password,
      });

      const salt = await bcrypt.genSalt(10);

      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id,
        },
      };

      res.status(200).send(payload);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("users_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);

// Validate Email Address
router.get('/verifyEmail/:id', [], async (req, res) => {
  const token = req.params.id;

  try {
    let user = await User.findOne({ emailToken: token });

    if (!user) {
      return res.status(400).json({ errors: [{ msg: i18n.__n("users_validation_failed") }] });
    }

    console.log(user.email, token);

    user.emailToken = null;
    user.verifiedEmail = true;

    await user.save();

    if (!user.verifiedPhone)
      return res.status(200).json({
        msg: i18n.__n("users_validation_success"),
        errors: [{ msg: i18n.__n("users_validation_phone_number_require") }],
      });

    res.status(200).send(payload);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      statusCode: 500,
      errors: [{ msg: i18n.__n("users_server_error"), errorCode: 'serverError' }],
    });
  }
});

// Validate Phone Number
router.post(
  '/validatePhone',
  [
    check('number', i18n.__n("users_number_require")).not().isEmpty(),
    check('token', i18n.__n("users_token_require")).not().isEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { number, token } = req.body;
    console.log(number, token);
    try {
      let user = await User.findOne({
        $and: [{ email }, { emailToken: token }],
      });

      if (!user) {
        return res.status(400).json({ errors: [{ msg: i18n.__n("users_validation_failed") }] });
      }

      user.emailToken = null;
      user.verifiedEmail = true;

      await user.save();

      if (!user.verifiedEmail)
        return res.status(200).json({
          msg: i18n.__n("users_email_validation_success"),
          errors: [{ msg: i18n.__n("users_email_validation_require") }],
        });

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: config.get('jwtExpiry') },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );

      res.status(200).send(payload);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("users_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);

// @route    POST v1/users/forgotPassword
// @desc     Register user
// @access   Public
router.post('/forgotPassword', function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        const token = require('crypto').randomBytes(32).toString('hex');
        User.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash('error', i18n.__n("users_no_account_with_email_exist"));
            return res.status(401).json({
              statusCode: 401,
              errors: [{ msg: i18n.__n("users_cannot_find_current_user"), errorCode: 'noUser' }],
            });;
          }
          user.authentication.resetPasswordToken = token;
          user.authentication.resetPasswordExpires = Date.now() + 3600000; // 1 hour
          user.save(function (err) {
            done(err, token, user);
          });
        });
      },

      // Need to change email template. 
      // And we need to send reset password link.  https://tridacom.hub/auth/resetPassword?_token=1c8cd7189d2e34ca07c7522d91e24ecbba18d791c6202d0d71fc30e0aa3d898e
      // We just need to change email template and put this link in email content.
      function (token, user, done) {
        const msg = {
          personalizations: [
            {
              to: [
                {
                  email: user.email,
                  name: user.firstName + ' ' + user.lastName,
                },
              ],
              dynamic_template_data: {
                firstName: user.firstName,
                lastName: user.lastName,
                emailToken: token,
              },
            },
          ],
          from: {
            email: 'noreply@tridacom.com',
            name: 'Tridacom IT Solutions Inc.',
          },
          template_id: config.sendgridTemplate.get('emailVerification'),
        };
        sendEmail(msg);
        done();
      },
    ],
    function (err) {
      if (err) return next(err);
      return res.status(200).json({
        statusCode: 200,
        data: { msg: i18n.__n("users_email_sent_success_check_email") },
      });
    }
  );
});

// @route    POST api/resetPassword
// @desc     Reset password
// @access   Public
router.post(
  '/resetPassword',
  [
    check('token', i18n.__n("users_token_require")).not().isEmpty(),
    check(
      'password',
      i18n.__n("users_valid_password_required")
    ).isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let user = await User.findOne({ "authentication.resetPasswordToken": req.body.token });
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          errors: [{ msg: i18n.__n("users_resetpassword_failed"), errorCode: 'resetPasswordfaild' }],
        });
      }

      // Token provided is a reset password token
      if (
        user.authentication.resetPasswordExpires < Date.now() ||
        user.authentication.resetPasswordExpires == null
      ) {
        // Token has expired
        user.authentication.resetPasswordToken = null; // Re-Init resetPaswordToken
        await user.save();
        
        return res.status(401).json({
          statusCode: 401,
          errors: [{ msg: i18n.__n("users_resetpassword_failed"), errorCode: 'resetPasswordfaild' }],
        });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(req.body.password, salt);
      user.authentication.resetPasswordToken = null; // Re-Init resetPaswordToken
      await user.save();

      return res.status(200).json({
        statusCode: 200,
        data: { msg: i18n.__n("users_reset_password_successfully") },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("users_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);
module.exports = router;