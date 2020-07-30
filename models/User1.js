const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    company: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    verifiedPhone: {
      type: Boolean,
      required: true,
      default: false,
    },
    verifiedEmail: {
      type: Boolean,
      required: true,
      default: false,
    },
    authentication: {
      preferredMFA: {
        type: String,
        enum: ['phone', 'email', 'push'],
        default: 'phone',
      },
      phoneToken: {
        type: String,
      },
      phoneTokenExpires: {
        type: Number,
      },
      emailToken: {
        type: String,
      },
      emailTokenExpires: {
        type: Number,
      },
      resetPasswordToken: {
        type: String,
      },
      resetPasswordExpires: {
        type: Number,
      },
    },
  },
  { timestamps: {} }
);

module.exports = User = mongoose.model('user', UserSchema);
