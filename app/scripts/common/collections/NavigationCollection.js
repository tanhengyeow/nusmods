'use strict';

const Backbone = require('backbone');
const NavigationModel = require('../models/NavigationModel');
require('backbone.select');

module.exports = Backbone.Collection.extend({
  model: NavigationModel,

  initialize(models) {
    Backbone.Select.One.applyTo(this, models);
  }
});
