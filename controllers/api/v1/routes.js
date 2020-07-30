var packagejson = require('../../../package.json');

module.exports = function (middleware, router, controllers) {
  // Shorten Vars
  var apiAuth = middleware.api;
  var apiCtrl = controllers.api.v1;
  var isAdmin = middleware.isAdmin;
  var isAgent = middleware.isAgent;
  var isAgentOrAdmin = middleware.isAgentOrAdmin;
  var canUser = middleware.canUser;

  // Users
  router.get(
    '/v1/users',
    apiAuth,
    canUser('accounts:view'),
    apiCtrl.users.getWithLimit
  );

  router.post(
    '/v1/users/create',
    apiAuth,
    canUser('accounts:create'),
    apiCtrl.users.create
  );
  router.get(
    '/v1/users/notifications',
    apiAuth,
    apiCtrl.users.getNotifications
  );
  router.get(
    '/v1/users/notificationCount',
    apiAuth,
    apiCtrl.users.notificationCount
  );
  router.get(
    '/v1/users/getAssignees',
    apiAuth,
    isAgentOrAdmin,
    apiCtrl.users.getAssingees
  );
  router.get(
    '/v1/users/:username',
    apiAuth,
    canUser('accounts:view'),
    apiCtrl.users.single
  );
  router.put(
    '/v1/users/:username',
    apiAuth,
    canUser('accounts:update'),
    apiCtrl.users.update
  );
  router.get('/v1/users/:username/groups', apiAuth, apiCtrl.users.getGroups);
  router.post(
    '/v1/users/:username/uploadprofilepic',
    apiAuth,
    apiCtrl.users.uploadProfilePic
  );
  router.put(
    '/v1/users/:username/updatepreferences',
    apiAuth,
    apiCtrl.users.updatePreferences
  );
  router.get(
    '/v1/users/:username/enable',
    apiAuth,
    canUser('accounts:update'),
    apiCtrl.users.enableUser
  );
  router.delete(
    '/v1/users/:username',
    apiAuth,
    canUser('accounts:delete'),
    apiCtrl.users.deleteUser
  );
  router.post(
    '/v1/users/:id/generateapikey',
    apiAuth,
    apiCtrl.users.generateApiKey
  );
  router.post(
    '/v1/users/:id/removeapikey',
    apiAuth,
    apiCtrl.users.removeApiKey
  );
  router.post(
    '/v1/users/:id/generatel2auth',
    apiAuth,
    apiCtrl.users.generateL2Auth
  );
  router.post(
    '/v1/users/:id/removel2auth',
    apiAuth,
    apiCtrl.users.removeL2Auth
  );

  // Common
  //router.post('/v1/login', apiCtrl.commonV1.login);
  //router.post('/v1/token', apiCtrl.commonV1.token);

  // Accounts
  /*
  router.get('/v1/accounts', apiAuth, apiCtrl.accounts.get);
  router.post('/v1/accounts', apiAuth, apiCtrl.accounts.create);
  router.put('/v1/accounts/:username', apiAuth, apiCtrl.accounts.update);

  // Tickets
  router.get('/v1/tickets', apiAuth, apiCtrl.tickets.get);
  router.post('/v1/tickets', apiAuth, apiCtrl.tickets.create);
  router.get('/v1/tickets/:uid', apiAuth, apiCtrl.tickets.single);
  router.put('/v1/tickets/batch', apiAuth, apiCtrl.tickets.batchUpdate);
  router.put('/v1/tickets/:uid', apiAuth, apiCtrl.tickets.update);
  router.delete('/v1/tickets/:uid', apiAuth, apiCtrl.tickets.delete);
  router.delete(
    '/v1/tickets/deleted/:id',
    apiAuth,
    isAdmin,
    apiCtrl.tickets.permDelete
  );

  // Groups
  router.get('/v1/groups', apiAuth, apiCtrl.groups.get);
  router.post('/v1/groups', apiAuth, apiCtrl.groups.create);
  router.put('/v1/groups/:id', apiAuth, apiCtrl.groups.update);
  router.delete('/v1/groups/:id', apiAuth, apiCtrl.groups.delete);

  // Teams
  router.get('/v1/teams', apiAuth, apiCtrl.teams.get);
  router.post('/v1/teams', apiAuth, apiCtrl.teams.create);
  router.put('/v1/teams/:id', apiAuth, apiCtrl.teams.update);
  router.delete('/v1/teams/:id', apiAuth, apiCtrl.teams.delete);

  // Departments
  router.get('/v1/departments', apiAuth, apiCtrl.departments.get);
  router.post('/v1/departments', apiAuth, apiCtrl.departments.create);
  router.put('/v1/departments/:id', apiAuth, apiCtrl.departments.update);
  router.delete('/v1/departments/:id', apiAuth, apiCtrl.departments.delete);

  router.get('/v1/departments/test', middleware.api, apiCtrl.departments.test);

  // ElasticSearch
  router.get('/v1/es/search', apiAuth, apiCtrl.elasticsearch.search);
  router.get('/v1/es/rebuild', apiAuth, isAdmin, apiCtrl.elasticsearch.rebuild);
  router.get('/v1/es/status', apiAuth, isAdmin, apiCtrl.elasticsearch.status);

  router.get('/v1/mailer/check', apiAuth, isAdmin, apiCtrl.mailer.check);
*/
};
