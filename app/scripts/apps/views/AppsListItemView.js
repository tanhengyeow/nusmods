'use strict';

const Marionette = require('backbone.marionette');
const template = require('../templates/apps_list_item.hbs');

module.exports = Marionette.ItemView.extend({
  tagName: 'div',
  className: 'col-md-8',
  template
});
