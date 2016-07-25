'use strict';

const ExamCollection = require('../../timetable/collections/ExamCollection');
const LessonCollection = require('../collections/LessonCollection');
const Marionette = require('backbone.marionette');
const TimetableModuleCollection = require('../collections/TimetableModuleCollection');
const localforage = require('localforage'); // eslint-disable-line import/no-unresolved
const config = require('../config');

module.exports = Marionette.Controller.extend({
  initialize(options) {
    this.semester = options.semester;
    this.saveOnChange = typeof options.saveOnChange !== 'undefined' ? options.saveOnChange : true;
    this.exams = new ExamCollection();
    this.timetable = new LessonCollection();
    this.selectedModules = new TimetableModuleCollection([], {
      exams: this.exams,
      timetable: this.timetable
    });
    if (this.saveOnChange) {
      this.listenTo(this.selectedModules, 'add remove', this.modulesChanged);
      this.listenTo(this.timetable, 'change', this.modulesChanged);
    }
  },

  modulesChanged() {
    if (!this.selectedModules.shared) {
      localforage.setItem(
        `${config.semTimetableFragment(this.semester)}:queryString`,
        this.selectedModules.toQueryString());
    }
  }
});
