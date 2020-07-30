const mongoose = require('mongoose');

const CitiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  stateCode: {
    type: String,
    required: true,
    trim: true,
  },
  country: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Country',
  },
  location: {
    type: [Number],
    index: '2d',
  },
  voiceServices: {
    phoneNumbers: {
      type: Boolean,
      required: true,
      default: false,
    },
    providerId: {
      type: String,
      trim: true,
    },
  },
  _recInfo: {
    dateEntered: {
      type: Date,
      required: true,
      default: Date.now,
    },
    enteredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dateUpdated: {
      type: Date,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    deletedFlag: {
      type: Boolean,
      required: true,
      default: false,
    },
    dateDeleted: {
      type: Date,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
});

CitiesSchema.pre('save', function (next) {
  this._recInfo.dateUpdated = Date.now();
  next();
});

module.exports = Cities = mongoose.model('Cities', CitiesSchema, 'cities');
