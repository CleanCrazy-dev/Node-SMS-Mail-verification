const config = require('config');
const twilioClient = require('twilio')(config.twilioSid, config.twilioKey);

module.exports.sendSMS = async function (smsData) {
  try {
    await twilioClient.messages.create(smsData);

    return true;
  } catch (err) {
    console.error(err.message);
    if (err.response) {
      console.error(err.response.body);
    }
    return false;
  }
};
