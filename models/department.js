var _ = require('lodash');
var async = require('async');
var mongoose = require('mongoose');

// Refs
require('./group');
var Teams = require('./team');
var Groups = require('./group');

var COLLECTION = 'departments';

var departmentSchema = mongoose.Schema({
  name: { type: String, required: true, unique: true },
  normalized: { type: String },
  teams: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'teams', autopopulate: true },
  ],
  allGroups: { type: Boolean, default: false },
  publicGroups: { type: Boolean, default: false },
  groups: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'groups', autopopulate: true },
  ],
});

departmentSchema.plugin(require('mongoose-autopopulate'));

departmentSchema.pre('save', function (next) {
  this.name = this.name.trim();
  this.normalized = this.name.trim().toLowerCase();

  return next();
});

departmentSchema.statics.getDepartmentsByTeam = function (teamIds, callback) {
  return this.model(COLLECTION)
    .find({ teams: { $in: teamIds } })
    .exec(callback);
};

departmentSchema.statics.getUserDepartments = function (userId, callback) {
  var self = this;

  Teams.getTeamsOfUser(userId, function (err, teams) {
    if (err) return callback(err);

    return self
      .model(COLLECTION)
      .find({ teams: { $in: teams } })
      .exec(callback);
  });
};

departmentSchema.statics.getDepartmentGroupsOfUser = function (
  userId,
  callback
) {
  var self = this;

  Teams.getTeamsOfUser(userId, function (err, teams) {
    if (err) return callback(err);

    return self
      .model(COLLECTION)
      .find({ teams: { $in: teams } })
      .exec(function (err, departments) {
        if (err) return callback(err);

        var hasAllGroups = _.some(departments, { allGroups: true });
        var hasPublicGroups = _.some(departments, { publicGroups: true });
        if (hasAllGroups) {
          return Groups.getAllGroups(callback);
        } else if (hasPublicGroups) {
          return Groups.getAllPublicGroups(function (err, publicGroups) {
            if (err) return callback(err);

            var mapped = departments.map(function (department) {
              return department.groups;
            });
            var merged = _.concat(publicGroups, mapped);

            merged = _.flattenDeep(merged);
            merged = _.uniqBy(merged, function (i) {
              return i._id;
            });

            return callback(null, merged);
          });
        } else {
          var groups = _.flattenDeep(
            departments.map(function (department) {
              return department.groups;
            })
          );

          return callback(null, groups);
        }
      });
  });
};

departmentSchema.statics.getDepartmentsByGroup = function (groupId, callback) {
  var self = this;

  return self
    .model(COLLECTION)
    .find({ $or: [{ groups: groupId }, { allGroups: true }] })
    .exec(callback);
};

module.exports = mongoose.model(COLLECTION, departmentSchema);
