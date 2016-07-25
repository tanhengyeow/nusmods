'use strict';

const Backbone = require('backbone');
require('backbone.select');

module.exports = Backbone.Model.extend({
  initialize() {
    Backbone.Select.Me.applyTo(this);
    this.selected = false;
  }
});
