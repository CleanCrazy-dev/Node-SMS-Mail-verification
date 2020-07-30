const mongoose = require('mongoose');

const CurrencySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    currencyIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    symbol: {
      type: String,
      required: true,
      trim: true,
    },
    currencyCode: {
      type: String,
      required: true,
      trim: true,
    },
    decimalSeparator: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfDecimals: {
      type: Number,
      min: 0,
      max: 6,
      required: true,
    },
    thousandsSeparator: {
      type: String,
      required: true,
      trim: true,
    },
    negativeParenthesesFlag: {
      type: Boolean,
      required: true,
      default: false,
    },
    displaySymbolFlag: {
      type: String,
      required: true,
    },
    recInfo: {
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
  },
  { timestamps: { dateEntered, dateUpdated, dateDeleted } }
);

CurrencySchema.pre('save', function (next) {
  this.recInfo.dateUpdated = Date.now();
  next();
});

module.exports = Currency = mongoose.model('Currency', CurrencySchema);
