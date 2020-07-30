var mongoose = require('mongoose');

var COLLECTION = 'settings';

var settingSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

settingSchema.statics.getSettings = function (callback) {
  var q = this.model(COLLECTION).find().select('name value');

  return q.exec(callback);
};

settingSchema.statics.getSettingByName = function (name, callback) {
  var q = this.model(COLLECTION).findOne({ name: name });

  return q.exec(callback);
};

settingSchema.statics.getSettingsByName = function (names, callback) {
  var q = this.model(COLLECTION).find({ name: names });

  return q.exec(callback);
};

settingSchema.statics.getSetting = settingSchema.statics.getSettingByName;

module.exports = mongoose.model(COLLECTION, settingSchema);
