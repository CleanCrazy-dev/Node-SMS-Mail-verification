const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
var User = require('../../../models/User');

var apiAuth = {};
const {
    sendSMSVerification,
    sendEmailVerification,
    loginUser,
} = require('../../../helpers/auth');

apiAuth.getUserByToken = async function (req, res) {
    try {
        const user = await User.findById(req.user.id).select(
            '-password -authentication'
        );
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            statusCode: 500,
            errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
        });
    }
};

apiAuth.authUserByEmail = async function (req, res) {
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
                errors: [{ msg: 'Cannot find the user.', errorCode: 'noUser' }],
            });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                statusCode: 401,
                errors: [{
                    msg: 'Invalid Credentials',
                    errorCode: 'invalidCredentials',
                }],
            });
        }

        const errArray = [];
        if (!user.verifiedPhone) {
            errArray.push({
                msg: 'Phone Number needs to be validated',
                verifiedPhone: false,
                errorCode: 'validationReqPhone',
            });
            sendSMSVerification(user._id);
        }

        if (!user.verifiedEmail) {
            errArray.push({
                msg: 'Email address needs to be validated',
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
            errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
        });
    }
}

apiAuth.verifyTokenForResetPassword = async function (req, res) {
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
                errors: [{ msg: 'Cannot find the user.', errorCode: 'noUser' }],
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
                    errors: [{ msg: 'Token Expired', errorCode: 'expiredToken' }],
                });
            }
            user.authentication.resetPasswordToken = null; // Re-Init resetPaswordToken
            await user.save();

            return res.status(200).json({
                statusCode: 200,
                data: [{ msg: 'Validation Successful' }],
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
                    errors: [{ msg: 'Token Expired', errorCode: 'expiredToken' }],
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
                    data: { msg: 'Validation Successful' },
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
                    errors: [{ msg: 'Token Expired', errorCode: 'expiredToken' }],
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
                    data: { msg: 'Validation Successful' },
                });
            }
        } else {
            return res.status(401).json({
                statusCode: 401,
                errors: [{ msg: 'Token is Invalid', errorCode: 'invalidToken' }],
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            statusCode: 500,
            errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
        });
    }
}

apiAuth.sendSMSCodeToMFA = async function (req, res) {
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
                errors: [{ msg: 'Cannot find the user.', errorCode: 'noUser' }],
            });
        }

        const { phone } = user;

        var maskedNumber = phone.slice(0, 5) + phone.slice(2).replace(/.(?=...)/g, '*');

        if (sendSMSVerification(user._id)) {
            return res.status(200).json({
                statusCode: 200,
                data: { msg: 'SMS Verification Sent', phoneNumber: maskedNumber },
            });
        } else {
            return res.status(400).json({
                statusCode: 400,
                errors: [{
                    msg: 'Failed to send MFA Code',
                    errorCode: 'failedMFASend',
                }],
            });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            statusCode: 500,
            errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
        });
    }
}

apiAuth.sendCodeToEmail = async function(req,res){
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
          errors: [{ msg: 'Cannot find the user.', errorCode: 'noUser' }],
        });
      }

      if (req.body.email !== user.email) {
        user.verifiedEmail = false;
        user.email = req.body.email;
        await user.save();
      }

      const { email, verifiedEmail } = user;
      var maskedEmail =
        email.slice(0, 5) + email.slice(2).replace(/.(?=...)/g, '*');

      if (sendEmailVerification(user._id)) {
        return res.status(200).json({
          statusCode: 200,
          data: { msg: 'Email Verification Sent', email: maskedEmail },
        });
      } else {
        return res.status(400).json({
          statusCode: 400,
          errors: [{
            msg: 'Failed to send MFA Code',
            errorCode: 'failedMFASend',
          }],
        });
      }
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        statusCode: 500,
        errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
      });
    }  
}

module.exports = apiAuth;