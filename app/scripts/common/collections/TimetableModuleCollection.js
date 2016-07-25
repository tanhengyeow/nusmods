'use strict';

const LessonCollection = require('../collections/LessonCollection');
const LessonModel = require('../models/LessonModel');
const ModuleCollection = require('./ModuleCollection');
const NUSMods = require('../../nusmods');
const Promise = require('bluebird'); // jshint ignore:line

const _ = require('underscore');
const qs = require('qs');

module.exports = ModuleCollection.extend({
  initialize(models, options) {
    this.colors = [];
    this.exams = options.exams;
    this.timetable = options.timetable;

    this.on('add', this.onAdd, this);
    this.on('remove', this.onRemove, this);
  },

  onAdd(module, collection, options) {
    if (!this.colors.length) {
      this.colors = [0, 1, 2, 3, 4, 5, 6, 7];
    }
    const color = this.colors.splice(Math.floor(Math.random() * this.colors.length), 1)[0];
    module.set('color', color);

    if (options && options.selectedLessons) {
      module.set('selectedLessons', options.selectedLessons);
    }

    return Promise.all([
      NUSMods.getModIndex(module.id),
      NUSMods.getTimetable(module.get('Semester'), module.id)
    ]).then(_.bind((modTimetable) => {
      let mod = modTimetable[0];
      mod = _.extend(mod, _.findWhere(mod.History, { Semester: module.get('Semester') }));
      mod.Timetable = modTimetable[1];
      module.set(mod);
      this.exams.addModule(module);
      const selectedLessonsByType = _.groupBy(options.selectedLessons, 'LessonType');
      const lessons = new LessonCollection();
      module.set('lessons', lessons);
      _.each(_.groupBy(module.get('Timetable'), 'LessonType'), (groups) => {
        const uniqueClassNos = _.uniq(_.pluck(groups, 'ClassNo'));
        const randomClassNo = _.sample(uniqueClassNos);
        const isDraggable = _.size(uniqueClassNos) > 1;
        const sameType = new LessonCollection();
        _.each(_.groupBy(groups, 'ClassNo'), (lessonsData) => {
          const sameGroup = new LessonCollection();
          _.each(lessonsData, (lessonData) => {
            const lesson = new LessonModel(_.extend({
              color,
              display: true,
              isDraggable,
              ModuleCode: module.id,
              ModuleTitle: module.get('ModuleTitle'),
              sameGroup,
              sameType
            }, lessonData));
            lessons.add(lesson);
            sameGroup.add(lesson);
            sameType.add(lesson);
            if (!selectedLessonsByType[lessonData.LessonType] &&
                lessonData.ClassNo === randomClassNo) {
              this.timetable.add(lesson);
            }
          }, this);
        }, this);
      }, this);
      _.each(options.selectedLessons, (lesson) => {
        this.timetable.add(lessons.where(lesson));
      }, this);
      this.timetable.trigger('change');
    }, this));
  },

  onRemove(module) {
    this.exams.remove(this.exams.get(module.id));
    this.timetable.remove(this.timetable.where({ ModuleCode: module.id }));

    // Return removed color back to color array to prevent
    // uneven distribution when new modules are added.
    this.colors.push(module.get('color'));
  },

  toJSON() {
    return this.map((module) => ({
      ModuleCode: module.id,
      selectedLessons: _.chain(this.timetable.where({ ModuleCode: module.id }))
        .map((lesson) => lesson.pick('ClassNo', 'LessonType'))
        .uniq('LessonType')
        .value()
    }), this);
  },

  toQueryString() {
    const qsObject = {};
    this.each((module) => {
      const qsModule = qsObject[module.id] = {};
      const moduleLessons = this.timetable.where({ ModuleCode: module.id });
      if (moduleLessons.length) {
        _.each(moduleLessons, (lesson) => {
          qsModule[lesson.get('typeAbbrev')] = lesson.get('ClassNo');
        });
      } else if (module.get('selectedLessons') && module.get('selectedLessons').length) {
        _.each(module.get('selectedLessons'), (lesson) => {
          qsModule[LessonModel.typeAbbrev[lesson.LessonType]] = lesson.ClassNo;
        });
      } else {
        qsObject[module.id] = '';
      }
    }, this);
    return decodeURIComponent(qs.stringify(qsObject));
  }
}, {
  fromQueryStringToJSON(queryString) {
    return _.map(qs.parse(queryString), (lessons, ModuleCode) => ({
      ModuleCode,
      selectedLessons: _.map(lessons, (ClassNo, LessonType) => ({
        ClassNo,
        LessonType: LessonModel.typeAbbrevInverse[LessonType]
      }))
    }));
  }
});
