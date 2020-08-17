const sgMail = require('@sendgrid/mail');
var nconf = require('nconf');
const EmailLog = require('../models/EmailLog');
sgMail.setApiKey(nconf.get('sendgridKey'));
const SENDGRIDTEMPLATE = nconf.get('sendgridTemplate')
// Sends Email using SendGrid
module.exports.sendEmail = async function (mailData) {
  try {
    const response = await sgMail.send(mailData);
    const xMessageId = response[0].headers['x-message-id'];
    const log = new EmailLog({
      x_message_id: xMessageId,
    });
    await log.save();
    return true;
  } catch (err) {
    console.error(err.message);
    if (err.response) {
      console.error(err.response.body);
    }
    return false;
  }
};

// Send New User Email
module.exports.sendNewUserEmail = async function (userId) {
  try {
    const user = await User.findById(userId).select('-password');
    if (!user) return false;

    const emailToken = uuid().replace(/-/g, '');
    user.emailToken = emailToken;
    await user.save();

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
            emailToken: user.emailToken,
          },
        },
      ],
      from: {
        email: 'noreply@tridacom.com',
        name: 'Tridacom IT Solutions Inc.',
      },
      template_id: SENDGRIDTEMPLATE.newUser,
    };

    return sendEmail(msg);
  } catch (err) {
    console.error(err.message);
    return false;
  }
};

// Prepare and send New User Email
module.exports.sendNewUserEmail = function (mailData) {};
