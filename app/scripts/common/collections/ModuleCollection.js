'use strict';

const Backbone = require('backbone');
const Module = require('../models/ModuleModel');

module.exports = Backbone.Collection.extend({
  model: Module
});
