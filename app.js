#!/usr/bin/env node

var async = require('async');
var path = require('path');
var fs = require('fs');
const winston = require('winston');
var nconf = require('nconf');
var Chance = require('chance');
var chance = new Chance();
var pkg = require('./package.json');

i18n = require('i18n');

// `var memory = require('./src/memory');

var isDocker = process.env.trihub_DOCKER || false;

global.forks = [];

nconf.argv().env();

global.env = process.env.NODE_ENV || 'development';
// global.env = process.env.NODE_ENV || 'production';

const logger = winston.createLogger({
  colorize: true,
  timestamp: function () {
    var date = new Date();
    return (
      date.getMonth() +
      1 +
      '/' +
      date.getDate() +
      ' ' +
      date.toTimeString().substr(0, 8) +
      ' [' +
      global.process.pid +
      ']'
    );
  },
  level: global.env === 'production' ? 'info' : 'verbose',
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
  winston.add(
    new winston.transports.Console({
      format: winston.format.simple(),
      colorize: true,
      level: 'debug',
    })
  );
}

i18n.configure({
  locales: ['en', 'es', 'fr'],
  defaultLocale: 'en',
  staticCatalog: {
    en: require('./locales/en.json'),
    es: require('./locales/es.json'),
    fr: require('./locales/fr.json'),
  },
});

if (!process.env.FORK) {
  winston.info(
    'Tridacom Hub API v' +
      pkg.version +
      ' Copyright (C) 2020 Tridacom IT Solutions Inc.'
  );
  winston.info(
    '=========================================================================='
  );
  winston.info('');
  winston.info('Running in: ' + global.env);
  winston.info('Server Time: ' + new Date());
}

var configFile = path.join(__dirname, '/config.json');
var configExists;

nconf.defaults({
  base_dir: __dirname,
  tokens: {
    secret: chance.hash() + chance.md5(),
    expires: 900,
  },
});

if (nconf.get('config')) {
  configFile = path.resolve(__dirname, nconf.get('config'));
}

configExists = fs.existsSync(configFile);

/*
function launchInstallServer () {
  var ws = require('./src/webserver')
  ws.installServer(function () {
    return winston.info('trihub Install Server Running...')
  })
}
*/

if (nconf.get('install') || (!configExists && !isDocker)) {
  console.log('needs configuration');
  //  launchInstallServer()
}

function loadConfig() {
  nconf.file({
    file: configFile,
  });
}

function start() {
  winston.debug('Starting...');
  if (!isDocker) loadConfig();

  var _db = require('./database');

  _db.init(function (err, db) {
    if (err) {
      winston.error('FETAL: ' + err.message);
      winston.warn('Retrying to connect to MongoDB in 10secs...');
      return setTimeout(function () {
        _db.init(dbCallback);
      }, 10000);
    } else {
      dbCallback(err, db);
    }
  });
}

function launchServer(db) {
  winston.debug('Launching...');
  var ws = require('./server.js');
  winston.debug('Initializing...');
  ws.init(db, function (err) {
    winston.debug('Initialized Web Server instance');
    if (err) {
      winston.error(err);
      return;
    }

    async.series(
      [
        function (next) {
          require('./settings/defaults').init(next);
          return next();
        },
        function (next) {
          require('./permissions').register(next);
        },
        /*        function (next) {
          require('./src/elasticsearch').init(function (err) {
            if (err) {
              winston.error(err);
            }

            return next();
          });
        },*/
        function (next) {
          winston.debug('Attempting to start Server');
          require('./socketserver')(ws);
          return next();
        },
        /*        function (next) {
          // Start Check Mail
          var settingSchema = require('./src/models/setting')
          settingSchema.getSetting('mailer:check:enable', function (err, mailCheckEnabled) {
            if (err) {
              winston.warn(err)
              return next(err)
            }

            if (mailCheckEnabled && mailCheckEnabled.value) {
              settingSchema.getSettings(function (err, settings) {
                if (err) return next(err)

                var mailCheck = require('./src/mailer/mailCheck')
                winston.debug('Starting MailCheck...')
                mailCheck.init(settings)

                return next()
              })
            } else {
              return next()
            }
          })
        },
        function (next) {
          require('./src/migration').run(next)
        },
        function (next) {
          winston.debug('Building dynamic sass...')
          require('./src/sass/buildsass').build(next)
        },*/
        // function (next) {
        //   // Start Task Runners
        //   require('./src/taskrunner')
        //   return next()
        // },
        /*function (next) {
          var cache = require('./cache/cache');
          if (isDocker) {
            var envDocker = {
              trihub_DOCKER: process.env.trihub_DOCKER,
              TD_MONGODB_SERVER: process.env.TD_MONGODB_SERVER,
              TD_MONGODB_PORT: process.env.TD_MONGODB_PORT,
              TD_MONGODB_USERNAME: process.env.TD_MONGODB_USERNAME,
              TD_MONGODB_PASSWORD: process.env.TD_MONGODB_PASSWORD,
              TD_MONGODB_DATABASE: process.env.TD_MONGODB_DATABASE,
            };

            cache.env = envDocker;
          }

          cache.init();

          return next();
        },*/
        /*        function (next) {
          var taskRunner = require('./src/taskrunner')
          return taskRunner.init(next)
        }*/
      ],
      function (err) {
        if (err) throw new Error(err);

        ws.listen(function () {
          winston.info('Tridacom Hub API Ready');
        });
      }
    );
  });
}

function dbCallback(err, db) {
  if (err || !db) {
    return start();
  }

  if (isDocker) {
    var s = require('./src/models/setting');
    s.getSettingByName('installed', function (err, installed) {
      if (err) return start();

      if (!installed) {
        return launchInstallServer();
      } else {
        return launchServer(db);
      }
    });
  } else {
    winston.debug('Attempting to launch server...');
    return launchServer(db);
  }
}

if (!nconf.get('install') && (configExists || isDocker)) start();
