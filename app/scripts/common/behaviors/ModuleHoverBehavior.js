'use strict';

const $ = require('jquery');
const Marionette = require('backbone.marionette');
const ModuleModel = require('../models/ModuleModel');
const NUSMods = require('../../nusmods');
const _ = require('underscore');

module.exports = Marionette.Behavior.extend({
  events: {
    'mouseenter a[href^=\'/modules/\']': 'showDetails',
    'click a[href^=\'/modules/\']': 'destroyDetails'
  },

  showDetails(event) {
    const curr = event.currentTarget;

    const reqModuleCode = $(curr).text();

    $(curr).qtip({
      content(qtipEvent, api) {
        NUSMods.getMod(reqModuleCode).then((data) => {
          const reqModuleModel = new ModuleModel(data);

          const title = reqModuleModel.get('ModuleTitle');
          const semesters = reqModuleModel.get('semesterNames');
          const offeredIn = _.reduce(semesters, (a, b) => `${a}, ${b}`);

          api.set('content.title', `<strong>${title}</strong>`);
          api.set('content.text', `Offered in: ${offeredIn}`);
        });
        return 'Loading...';
      },
      show: {
        event: event.type,
        ready: true
      },
      position: {
        effect: 'false',
        my: 'bottom center',
        at: 'top center'
      },
      events: {
        show(showEvent) {
          // Prevents tags with data-no-module-qtip from loading
          if (curr.hasAttribute('data-no-module-qtip')) {
            showEvent.preventDefault();
          }
        }
      }
    }, event);
  },
  destroyDetails(event) {
    const curr = event.currentTarget;
    $(curr).qtip('destroy', true);
  }
});

