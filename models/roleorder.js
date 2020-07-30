var _ = require('lodash');
var mongoose = require('mongoose');

var COLLECTION = 'role_order';

var roleOrder = mongoose.Schema({
  order: [mongoose.Schema.Types.ObjectId],
});

roleOrder.statics.getOrder = function (callback) {
  return this.model(COLLECTION).findOne({}).exec(callback);
};

roleOrder.statics.getOrderLean = function (callback) {
  return this.model(COLLECTION).findOne({}).lean().exec(callback);
};

roleOrder.methods.updateOrder = function (order, callback) {
  this.order = order;
  this.save(callback);
};

roleOrder.methods.getHierarchy = function (checkRoleId) {
  var idx = _.findIndex(this.order, function (i) {
    return i.toString() === checkRoleId.toString();
  });
  if (idx === -1) return [];
  if (idx === 0) return this.order;
  return _.drop(this.order, idx);
};

roleOrder.methods.removeFromOrder = function (_id, callback) {
  this.order = _.filter(this.order, function (o) {
    return o.toString() !== _id.toString();
  });

  this.save(callback);
};

module.exports = mongoose.model(COLLECTION, roleOrder, COLLECTION);
