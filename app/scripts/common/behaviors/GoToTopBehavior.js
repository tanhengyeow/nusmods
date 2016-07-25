'use strict';

const $ = require('jquery');
const Marionette = require('backbone.marionette');
const _ = require('underscore');
const analytics = require('../../analytics');

module.exports = Marionette.Behavior.extend({
  defaults: {
    triggerThreshold: 100
  },

  events: {
    'click @ui.backToTopButton': 'scrollToTop'
  },

  onShow() {
    const that = this;
    $(window).scroll(_.debounce(() => {
      $(that.view.ui.backToTopButton).toggleClass('visible',
        $(this).scrollTop() > that.options.triggerThreshold);
    }, 50));
  },

  scrollToTop() {
    analytics.track('Misc', 'Back to top', window.location.pathname);
    $('html,body').stop(true, true).animate({ scrollTop: 0 }, 400);
    $(this.view.ui.backToTopButton).blur();
  }
});
