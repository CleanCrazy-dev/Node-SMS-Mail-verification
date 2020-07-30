var express = require('express');
var router = express.Router();
var controllers = require('../controllers');
var path = require('path');
var winston = require('winston');
var packagejson = require('../package.json');

function mainRoutes(router, middleware, controllers) {
  /*  router.get(
    '/',
    middleware.redirectToDashboardIfLoggedIn,
    controllers.main.index
  );
  */
  router.get('/healthz', function (req, res) {
    return res.status(200).send('OK');
  });
  router.get('/version', function (req, res) {
    return res.json({ version: packagejson.version });
  });

  // API
  require('../controllers/api/v1/routes')(middleware, router, controllers);

  /*
  router.get('/captcha', function (req, res) {
    var svgCaptcha = require('svg-captcha');
    var captcha = svgCaptcha.create();
    req.session.captcha = captcha.text;
    res.set('Content-Type', 'image/svg+xml');
    res.send(captcha.data);
  });

  // v1
  
  router.get('/api/v1/plugins/list/installed', middleware.api, function (
    req,
    res
  ) {
    return res.json({ success: true, loadedPlugins: global.plugins });
  });
  /*
  router.get(
    '/api/v1/plugins/install/:packageid',
    middleware.api,
    middleware.isAdmin,
    controllers.api.v1.plugins.installPlugin
  );
  router.delete(
    '/api/v1/plugins/remove/:packageid',
    middleware.api,
    middleware.isAdmin,
    controllers.api.v1.plugins.removePlugin
  );

  router.get(
    '/api/v1/admin/restart',
    middleware.api,
    middleware.isAdmin,
    function (req, res) {
      var pm2 = require('pm2');
      pm2.connect(function (err) {
        if (err) {
          winston.error(err);
          res.status(400).send(err);
          return;
        }
        pm2.restart('trihub', function (err) {
          if (err) {
            res.status(400).send(err);
            return winston.error(err);
          }

          pm2.disconnect();
          res.json({ success: true });
        });
      });
    }
  );
*/
  if (global.env === 'development') {
    router.get('/debug/populatedb', controllers.debug.populatedatabase);
    router.get('/debug/sendmail', controllers.debug.sendmail);
    router.get('/debug/mailcheck/refetch', function (req, res) {
      var mailCheck = require('../mailer/mailCheck');
      mailCheck.refetch();
      res.send('OK');
    });

    router.get('/debug/cache/refresh', function (req, res) {
      var _ = require('lodash');

      var forkProcess = _.find(global.forks, { name: 'cache' });
      forkProcess.fork.send({ name: 'cache:refresh' });

      res.send('OK');
    });
    /*
    router.get('/debug/restart', function (req, res) {
      var pm2 = require('pm2');
      pm2.connect(function (err) {
        if (err) {
          winston.error(err);
          res.status(400).send(err);
          return;
        }
        pm2.restart('trihub', function (err) {
          if (err) {
            res.status(400).send(err);
            return winston.error(err);
          }

          pm2.disconnect();
          res.send('OK');
        });
      });
    });
    */
  }
}

module.exports = function (app, middleware) {
  mainRoutes(router, middleware, controllers);
  app.use('/', router);
  /*
  // Load Plugin routes
  var dive = require('dive');
  var fs = require('fs');
  var pluginDir = path.join(__dirname, '../../plugins');
  if (!fs.existsSync(pluginDir)) fs.mkdirSync(pluginDir);
  dive(
    pluginDir,
    { directories: true, files: false, recursive: false },
    function (err, dir) {
      if (err) throw err;
      var pluginRoutes = require(path.join(dir, '/routes'));
      if (pluginRoutes) {
        pluginRoutes(router, middleware);
      } else {
        winston.warn('Unable to load plugin: ' + pluginDir);
      }
    }
  );
*/
  app.use(handle404);
  app.use(handleErrors);
};

function handleErrors(err, req, res) {
  var status = err.status || 500;
  res.status(err.status);

  if (status === 404) {
    res.render('404', { layout: false });
    return;
  }

  if (status === 503) {
    res.render('503', { layout: false });
    return;
  }

  winston.warn(err.stack);

  res.render('error', {
    message: err.message,
    error: err,
    layout: false,
  });
}

function handle404(req, res) {
  return res.status(404).render('404', { layout: false });
}
