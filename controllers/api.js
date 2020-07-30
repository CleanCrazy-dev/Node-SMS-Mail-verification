/*
var apiTagsV1 = require('./api/v1/tags');
var apiNoticesV1 = require('./api/v1/notices');
var apiMessagesV1 = require('./api/v1/messages');
var apiGroupsV1 = require('./api/v1/groups');
var apiSettingsV1 = require('./api/v1/settings');
*/
var apiUsersV1 = require('./api/v1/users');

var apiController = {};

apiController.index = function (req, res) {
  return res.json({ supported: ['v1'] });
};

apiController.v1 = {};

apiController.v1.users = apiUsersV1;

//apiController.v1.accounts = require('./api/v1/accounts');
/*apiController.v1.tags = apiTagsV1;
apiController.v1.notices = apiNoticesV1;
apiController.v1.users = apiUsersV1;
apiController.v1.messages = apiMessagesV1;
apiController.v1.reports = apiReportsV1;
apiController.v1.settings = apiSettingsV1;
apiController.v1.plugins = apiPluginsV1;
apiController.v1.roles = require('./api/v1/roles');

V2:
apiController.v1.common = require('./api/v1/common');
apiController.v1.tickets = require('./api/v1/tickets');
apiController.v1.groups = require('./api/v1/groups');
apiController.v1.teams = require('./api/v1/teams');
apiController.v1.departments = require('./api/v1/departments');
apiController.v1.elasticsearch = require('./api/v1/elasticsearch');
apiController.v1.mailer = require('./api/v1/mailer');
*/

module.exports = apiController;
