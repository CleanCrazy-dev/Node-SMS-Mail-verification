var nconf = require('nconf');
const TWILIOSID = nconf.get('twilioSid');
const TWILIOKEY = nconf.get('twilioKey');
const twilioClient = require('twilio')(TWILIOSID, TWILIOKEY);

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
