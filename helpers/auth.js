const config = require('config');
const jwt = require('jsonwebtoken');
const { sendSMS } = require('./twilio');
const { sendEmail } = require('./sendgrid');
const { uuid } = require('uuidv4');
const User = require('./../models/User');

// Send SMS Verification Code
module.exports.sendSMSVerification = async function (userId) {
  console.log('User ID', userId);
  try {
    const user = await User.findById(userId).select(
      'phone authentication.phoneToken verifiedPhone'
    );
    if (!user) return false;

    const { phone, verifiedPhone } = user;

    const phoneCode = Math.floor(100000 + Math.random() * 900000);
    user.authentication.phoneToken = phoneCode;
    user.authentication.phoneTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const smsParams = {
      body: `${phoneCode}\nUse this code for Tridacom verification`,
      messagingServiceSid: config.twilioService.smsMFA,
      to: phone,
    };

    return sendSMS(smsParams);
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

// Send Email Verification Code
module.exports.sendEmailVerification = async function (userId) {
  try {
    const user = await User.findById(userId).select(
      'firstName lastName email authentication.emailToken verifiedEmail'
    );
    if (!user) return false;

    const { firstName, lastName, email, verifiedEmail } = user;

    const emailToken = Math.floor(100000 + Math.random() * 900000);
    user.authentication.emailToken = emailToken;
    user.authentication.emailTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const msg = {
      personalizations: [
        {
          to: [
            {
              email: email,
              name: firstName + ' ' + lastName,
            },
          ],
          dynamic_template_data: {
            firstName: firstName,
            lastName: lastName,
            emailToken: emailToken,
          },
        },
      ],
      from: {
        email: 'noreply@tridacom.com',
        name: 'Tridacom IT Solutions Inc.',
      },
      template_id: config.sendgridTemplate.get('emailVerification'),
    };

    return sendEmail(msg);
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

module.exports.loginUser = async function (userData) {
  try {
    const payload = {
      user: {
        id: userData._id,
      },
    };

    var jwtToken = jwt.sign(payload, config.get('jwtSecret'), {
      expiresIn: config.get('jwtExpiry'),
    });

    if (!jwtToken) {
      console.log('returning');
      return {
        statusCode: 500,
        errors: { msg: 'Can not sign token', errorCode: 'jwtError' },
      };
    }

    return {
      statusCode: 200,
      data: {
        id: userData._id,
        token: jwtToken,
      },
    };
  } catch (err) {
    return {
      statusCode: 500,
      errors: { msg: i18n.__n("auth_server_error"), errorCode: 'serverError' },
    };
  }
};
