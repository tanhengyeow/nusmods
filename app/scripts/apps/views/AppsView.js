'use strict';

const $ = require('jquery');
const Backbone = require('backbone');
const Marionette = require('backbone.marionette');
const template = require('../templates/apps.hbs');
const AppsListView = require('./AppsListView');

const APPS_LIST_URL = 'https://nusmodifications.github.io/nusmods-apps/apps.json';

module.exports = Marionette.LayoutView.extend({
  template,
  regions: {
    appsListRegion: '.nm-news-apps-container'
  },
  onShow() {
    const that = this;
    $.ajax({
      type: 'GET',
      contentType: 'application/json',
      url: APPS_LIST_URL,
      dataType: 'jsonp',
      jsonpCallback: 'callback',
      success(data) {
        that.appsListRegion.show(new AppsListView({
          collection: new Backbone.Collection(data)
        }));
      }
    });
  }
});
