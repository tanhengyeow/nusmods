'use strict';

const App = require('../app');
const AppsView = require('./views/AppsView');
const Marionette = require('backbone.marionette');

const navigationItem = App.request('addNavigationItem', {
  name: 'Apps',
  icon: 'cubes',
  url: '/apps'
});

const controller = {
  showApps() {
    navigationItem.select();
    App.mainRegion.show(new AppsView());
  }
};

App.addInitializer(() => {
  new Marionette.AppRouter({ // eslint-disable-line no-new
    controller,
    appRoutes: {
      apps: 'showApps'
    }
  });
});

