const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  iso3: {
    type: String,
    required: true,
    trim: true,
  },
  iso2: {
    type: String,
    required: true,
    trim: true,
  },
  phoneCode: {
    type: String,
    required: true,
    trim: true,
  },
  capitalCity: {
    type: String,
    required: true,
    trim: true,
  },
  currencyCode: {
    type: String,
    trim: true,
  },
  states: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    name: {
      type: String,
    },
    state_code: {
      type: String,
    },
  },
  providesNativeServices: {
    type: Boolean,
    default: false,
  },
  voiceServices: {
    voice: {
      type: Boolean,
      default: false,
    },
    fax: {
      type: Boolean,
      default: false,
    },
    sms: {
      type: Boolean,
      default: false,
    },
    msTeams: {
      type: Boolean,
      default: false,
    },
    porting: {
      type: Boolean,
      default: false,
    },
    portingRequirements: [
      {
        type: String,
        enum: [
          'LOA',
          'LATEST_INVOICE',
          'ACCOUNT_NUMBER',
          'COMPANY_REG',
          'PASSPORT',
          'LEGAL_PROOF',
          'EU_LOCAL_CITY',
          'EU_LOCAL_COUNTRY',
          'RELEASE_LETTER',
          'LATEST_PAYMENT',
          'OTHER',
        ],
      },
    ],
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

CountrySchema.pre('save', function (next) {
  this._recInfo.dateUpdated = Date.now();
  next();
});

module.exports = Country = mongoose.model('Country', CountrySchema);
