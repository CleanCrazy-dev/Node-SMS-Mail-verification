'use strict';

var _ = require('lodash');
var db = require('../database');
var mongoose = require('mongoose');
var winston = require('winston');

var middleware = {};

middleware.db = function (req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    winston.warn('MongoDB ReadyState = ' + mongoose.connection.readyState);
    db.init(function (e, database) {
      if (e) {
        return res.status(503).send();
      }

      req.db = database;
    });
  }

  return next();
};

middleware.cache = function (seconds) {
  return function (req, res, next) {
    res.setHeader('Cache-Control', 'public, max-age=' + seconds);

    next();
  };
};

middleware.checkCaptcha = function (req, res, next) {
  var postData = req.body;
  if (postData === undefined) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' });
  }

  var captcha = postData.captcha;
  var captchaValue = req.session.captcha;

  if (captchaValue === undefined) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' });
  }

  if (captchaValue.toString() !== captcha.toString()) {
    return res.status(400).json({ success: false, error: 'Invalid Captcha' });
  }

  return next();
};

middleware.checkOrigin = function (req, res, next) {
  var origin = req.headers.origin;
  var host = req.headers.host;

  // TODO: Fix this once Firefox fixes its Origin Header in same-origin POST request.
  if (!origin) {
    origin = host;
  }

  origin = origin.replace(/^https?:\/\//, '');

  if (origin !== host) {
    return res.status(400).json({ success: false, error: 'Invalid Origin!' });
  }

  return next();
};

// API
middleware.api = function (req, res, next) {
  // ByPass auth for now if user is set through session
  if (req.user) return next();

  var passport = require('passport');
  passport.authenticate('jwt', { session: true }, function (err, user) {
    if (err || !user)
      return res
        .status(401)
        .json({ success: false, error: 'Invalid Authentication Token' });
    if (user) {
      req.user = user;
      return next();
    }

    return res
      .status(500)
      .json({ success: false, error: 'Unknown Error Occurred' });
  })(req, res, next);
};

middleware.hasAuth = middleware.api;

middleware.canUser = function (action) {
  return function (req, res, next) {
    if (!req.user)
      return res
        .status(401)
        .json({ success: false, error: 'Not Authorized for this API call.' });
    var permissions = require('../permissions');
    var perm = permissions.canThis(req.user.role, action);
    if (perm) return next();

    return res
      .status(401)
      .json({ success: false, error: 'Not Authorized for this API call.' });
  };
};

middleware.isAdmin = function (req, res, next) {
  var roles = global.roles;
  var role = _.find(roles, { _id: req.user.role._id });
  role.isAdmin = role.grants.indexOf('admin:*') !== -1;

  if (role.isAdmin) return next();

  return res
    .status(401)
    .json({ success: false, error: 'Not Authorized for this API call.' });
};

middleware.isAgentOrAdmin = function (req, res, next) {
  var role = _.find(global.roles, { _id: req.user.role._id });
  role.isAdmin = role.grants.indexOf('admin:*') !== -1;
  role.isAgent = role.grants.indexOf('agent:*') !== -1;

  if (role.isAgent || role.isAdmin) return next();

  return res
    .status(401)
    .json({ success: false, error: 'Not Authorized for this API call.' });
};

middleware.isAgent = function (req, res, next) {
  var role = _.find(global.roles, { _id: req.user.role._id });
  role.isAgent = role.grants.indexOf('agent:*') !== -1;

  if (role.isAgent) return next();

  return res
    .status(401)
    .json({ success: false, error: 'Not Authorized for this API call.' });
};

middleware.isSupport = middleware.isAgent;

module.exports = function () {
  return middleware;
};
