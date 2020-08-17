const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
var nconf = require('nconf');
const bcrypt = require('bcryptjs');
var apiCommon = {};
const JWT_SECRET = nconf.get('jwtSecret');
const JWT_EXPIRY = nconf.get('jwtExpiry');
var User = require('../../../models/User');
apiCommon.login = async function (req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                statusCode: 401,
                errors: [{ msg: 'Cannot find the user email.', errorCode: 'noUser' }],
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
        const payload = {
            user: {
                id: user.id,
            },
        };
        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY },
            async (err, token) => {
                if (err) throw err;
                user.jwtToken = token;
                await user.save();
                res.status(200).json({ success: true, token: token });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            statusCode: 500,
            errors: [{ msg: 'Server Error', errorCode: 'serverError' }],
        });
    }
};

module.exports = apiCommon;