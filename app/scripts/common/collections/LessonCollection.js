'use strict';

const Backbone = require('backbone');
const Lesson = require('../models/LessonModel');

module.exports = Backbone.Collection.extend({
  model: Lesson
});
