const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const config = require('config');
const jwt = require('jsonwebtoken');

const { check, validationResult } = require('express-validator');
const {
  sendSMSVerification,
  sendEmailVerification,
  loginUser,
} = require('../../helpers/auth');
const User = require('../../models/User');

// @route    GET /v1/auth
// @desc     Get user by token
// @access   Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      '-password -authentication'
    );
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      statusCode: 500,
      errors: [{ msg: i18n.__n("auth_server_error"), errorCode: 'serverError' }],
    });
  }
});

// @route    POST /v1/auth
// @desc     Authenticate User by Email and Password
// @access   Public
router.post(
  '/',
  [
    check('username', i18n.__n('auth_validation_email_phone_required')).exists(),
    check('password', i18n.__n('auth_validation_password_required')).exists(),
  ],
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({ statusCode: 401, errors: validationErrors.array() });
    }

    const { username, password } = req.body;

    try {
      let user = await User.findOne({
        $or: [{ phone: username }, { email: username }],
      });
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          errors: [{ msg: i18n.__n('auth_cannot_find_user'), errorCode: 'noUser' }],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({
          statusCode: 401,
          errors: [{
            msg: i18n.__n('auth_invalid_credential'),
            errorCode: 'invalidCredentials',
          }],
        });
      }

      const errArray = [];
      if (!user.verifiedPhone) {
        errArray.push({
          msg:  i18n.__n('auth_phone_number_validation_require'),
          verifiedPhone: false,
          errorCode: 'validationReqPhone',
        });
        sendSMSVerification(user._id);
      }

      if (!user.verifiedEmail) {
        errArray.push({
          msg:  i18n.__n('auth_email_validation_require'),
          verifiedEmail: false,
          errorCode: 'validationReqEmail',
        });
        sendEmailVerification(user._id);
      }

      if (errArray.length > 0)
        return res.status(400).json({
          statusCode: 400,
          data: {
            id: user._id
          },
          errors: errArray,
        });

      var mfaMasked = null;
      var mfaDestination = null;
      switch (user.authentication.preferredMFA) {
        case 'email':
          sendEmailVerification(user._id);
          mfaMasked =
            user.email.slice(0, 5) +
            user.email.slice(2).replace(/.(?=...)/g, '*');
          mfaDestination = user.email;
          break;
        case 'phone':
        default:
          sendSMSVerification(user._id);
          mfaMasked =
            user.phone.slice(0, 5) +
            user.phone.slice(2).replace(/.(?=...)/g, '*');
          mfaDestination = user.phone;
          break;
      }

      return res.status(200).json({
        statusCode: 200,
        data: {
          id: user._id,
          mfaMethod: user.authentication.preferredMFA,
          mfaDestination: mfaMasked
        },
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("auth_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);

// @route    POST /v1/auth/verify
// @desc     Validate Token Against Account for MFA and Password Reset
// @access   Public
router.post(
  '/verify',
  [
    check('username', i18n.__n("auth_include_valid_emial_or_phone_number")).exists(),
    check('token', i18n.__n("auth_token_require")).exists(),
  ],
  async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({ statusCode: 401, errors: validationErrors.array() });
    }

    const { username, token, id, login } = req.body;

    try {
      if (req.body.id) {
        var user = await User.findOne({
          $or: [{ phone: username }, { email: username }],
          $and: [{ _id: id }],
        });
      } else {
        var user = await User.findOne({
          $or: [{ phone: username }, { email: username }]
        });
      }
      if (!user) {
        return res.status(401).json({
          statusCode: 401,
          errors: [{ msg: i18n.__n("auth_cannot_find_user"), errorCode: 'noUser' }],
        });
      }

      if (user.authentication.resetPasswordToken == token) {
        // Token provided is a reset password token
        if (
          user.authentication.resetPasswordTokenExpires < Date.now() ||
          user.authentication.resetPasswordTokenExpires == null
        ) {
          // Token has expired
          return res.status(401).json({
            statusCode: 401,
            errors: [{ msg: i18n.__n("auth_token_expired"), errorCode: 'expiredToken' }],
          });
        }
        user.authentication.resetPasswordToken = null; // Re-Init resetPaswordToken
        await user.save();

        return res.status(200).json({
          statusCode: 200,
          data: [{ msg: i18n.__n("auth_validation_successful") }],
        });
      } else if (user.authentication.phoneToken == token) {
        // Token provided is a phone token
        if (
          user.authentication.phoneTokenExpires < Date.now() ||
          user.authentication.phoneTokenExpires == null
        ) {
          // Token has expired
          return res.status(401).json({
            statusCode: 401,
            errors: [{ msg: i18n.__n("auth_token_expired"), errorCode: 'expiredToken' }],
          });
        }
        user.authentication.phoneToken = null; // Re-Init phone token
        user.verifiedPhone = true;
        await user.save();
        if (login) {
          var returnJSON = await loginUser(user);
          return res.status(200).json(returnJSON);
        } else {
          return res.status(200).json({
            statusCode: 200,
            data: { msg:  i18n.__n("auth_validation_successful") },
          });
        }
      } else if (user.authentication.emailToken == token) {
        // Token provided is a email token
        if (
          user.authentication.emailTokenExpires < Date.now() ||
          user.authentication.emailTokenExpires == null
        ) {
          // Token has expired
          return res.status(401).json({
            statusCode: 401,
            errors: [{ msg:  i18n.__n("auth_token_expired"), errorCode: 'expiredToken' }],
          });
        }
        user.authentication.emailToken = null; // Re-Init email token
        user.verifiedEmail = true;
        await user.save();
        if (login) {
          var returnJSON = await loginUser(user);
          return res.status(200).json(returnJSON);
        } else {
          return res.status(200).json({
            statusCode: 200,
            data: { msg:  i18n.__n("auth_validation_successful") },
          });
        }
      } else {
        return res.status(401).json({
          statusCode: 401,
          errors: [{ msg:  i18n.__n("auth_invalid_token"), errorCode: 'invalidToken' }],
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("auth_server_error"),  errorCode: 'serverError' }],
      });
    }
  }
);

// @route    POST /v1/auth/sendSMS
// @desc     Send SMS Code to MFA
// @access   Public
router.post(
  '/sendSMS',
  [],
  async (req, res) => {
    console.log("req",req)
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({ statusCode: 401, errors: validationErrors.array() });
    }

    const { id } = req.body;

    try {
      if (!req.body.id) {
        var user = await User.findOne({ phone: req.body.phone }).select('_id phone verifiedPhone');
      } else {
        var user = await User.findById(id).select('_id phone verifiedPhone');
      }
      if (!user) {
        return res.status(400).json({
          statusCode: 400,
          errors: [{ msg: i18n.__n("auth_cannot_find_user"), errorCode: 'noUser' }],
        });
      }


      /*      if (req.body.phone !== user.phone) {
              user.verifiedPhone = false;
              user.phone = req.body.phone;
              await user.save();
            }
      */
      const { phone, verifiedPhone } = user;

      /*if (!verifiedPhone) {
        return res.status(400).json({
          statusCode: 400,
          errors: [{
            msg: 'Phone number needs to be validated first.',
            errorCode: 'validationReqPhone',
          }],
        });
      }*/

      var maskedNumber =
        phone.slice(0, 5) + phone.slice(2).replace(/.(?=...)/g, '*');

      if (sendSMSVerification(user._id)) {
        return res.status(200).json({
          statusCode: 200,
          data: { msg: i18n.__n("auth_sms_verification_sent"), phoneNumber: maskedNumber },
        });
      } else {
        return res.status(400).json({
          statusCode: 400,
          errors: [{
            msg: i18n.__n("auth_failed_to_send_mfa_code"),
            errorCode: 'failedMFASend',
          }],
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("auth_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);

// @route    POST /v1/auth/sendEmail
// @desc     Send Code for MFA to Email
// @access   Public
router.post(
  '/sendEmail',
  [], async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({ statusCode: 400, errors: validationErrors.array() });
    }

    const { id } = req.body;

    try {
      if (!req.body.id) {
        var user = await User.findOne({ email: req.body.email }).select('_id email verifiedEmail');
      } else {
        var user = await User.findById(id).select('_id email verifiedEmail');
      }

      if (!user) {
        return res.status(400).json({
          statusCode: 400,
          errors: [{ msg:  i18n.__n("auth_cannot_find_user"), errorCode: 'noUser' }],
        });
      }

      if (req.body.email !== user.email) {
        user.verifiedEmail = false;
        user.email = req.body.email;
        await user.save();
      }

      const { email, verifiedEmail } = user;

      /*      if (!verifiedEmail) {
              return res.status(400).json({
                statusCode: 400,
                errors: [{
                  msg: 'Email address needs to be validated first.',
                  errorCode: 'validationReqEmail',
                }],
              });
            }*/

      var maskedEmail =
        email.slice(0, 5) + email.slice(2).replace(/.(?=...)/g, '*');

      if (sendEmailVerification(user._id)) {
        return res.status(200).json({
          statusCode: 200,
          data: { msg:  i18n.__n("auth_email_verification_sent"), email: maskedEmail },
        });
      } else {
        return res.status(400).json({
          statusCode: 400,
          errors: [{
            msg: i18n.__n("auth_failed_to_send_mfa_code"),
            errorCode: 'failedMFASend',
          }],
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: i18n.__n("auth_server_error"), errorCode: 'serverError' }],
      });
    }
  }
);

module.exports = router;
