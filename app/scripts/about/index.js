'use strict';

const AboutView = require('./views/AboutView');
const App = require('../app');
const Backbone = require('backbone');
const Marionette = require('backbone.marionette');
const TeamView = require('./views/TeamView');
const team = require('./team.json');

const controller = {
  showAbout() {
    App.mainRegion.show(new AboutView());
    App.navigationRegion.currentView.options.collection.deselect();
  },
  showTeam() {
    const teamModel = new Backbone.Model({ team });
    App.mainRegion.show(new TeamView({ model: teamModel }));
    App.navigationRegion.currentView.options.collection.deselect();
  }
};

App.addInitializer(() => {
  new Marionette.AppRouter({ // eslint-disable-line no-new
    controller,
    appRoutes: {
      about: 'showAbout',
      team: 'showTeam'
    }
  });
});
