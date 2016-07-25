'use strict';

const Backbone = require('backbone');
const _ = require('underscore');
const config = require('../../common/config');
const modulify = require('../utils/modulify');
const padTwo = require('../utils/padTwo');

// Convert exam in ISO format to 12-hour date/time format. We slice off the
// SGT time zone and interpret as UTC time, then use the getUTC* methods so
// that they will correspond to Singapore time regardless of the local time
// zone.
const examStr = (exam) => {
  if (exam) {
    const date = new Date(`${exam.slice(0, 16)}Z`);
    const hours = date.getUTCHours();
    return padTwo(date.getUTCDate()) +  // eslint-disable-line prefer-template
      '-' + padTwo(date.getUTCMonth() + 1) +
      '-' + date.getUTCFullYear() +
      ' ' + (hours % 12 || 12) +
      ':' + padTwo(date.getUTCMinutes()) +
      ' ' + (hours < 12 ? 'AM' : 'PM');
  }
  return null;
};

const DESCRIPTION_LIMIT = 40;

const shortenDescription = (desc) => (
  desc.split(' ').splice(0, DESCRIPTION_LIMIT).join(' ')
);

const workloadify = (workload) => {
  const workloadArray = workload.split('-');
  const workloadComponents = {
    lectureHours: workloadArray[0],
    tutorialHours: workloadArray[1],
    labHours: workloadArray[2],
    projectHours: workloadArray[3],
    preparationHours: workloadArray[4]
  };
  _.each(workloadComponents, (value, key) => {
    workloadComponents[key] = parseInt(value, 10);
  });
  return workloadComponents;
};

const semesterNames = config.semesterNames;

module.exports = Backbone.Model.extend({
  idAttribute: 'ModuleCode',
  initialize() {
    const description = this.get('ModuleDescription');
    if (description && description.split(' ').length > DESCRIPTION_LIMIT + 10) {
      this.set('ShortModuleDescription', shortenDescription(this.get('ModuleDescription')));
    }

    const workload = this.get('Workload');
    if (workload) {
      this.set('WorkloadComponents', workloadify(workload));
    }

    const prerequisite = this.get('Prerequisite');
    if (prerequisite) {
      this.set('linkedPrerequisite', modulify.linkifyModules(prerequisite));
    }

    const corequisite = this.get('Corequisite');
    if (corequisite) {
      this.set('linkedCorequisite', modulify.linkifyModules(corequisite));
    }

    const preclusion = this.get('Preclusion');
    if (preclusion) {
      this.set('linkedPreclusion', modulify.linkifyModules(preclusion));
    }

    _.each(this.get('History'), (history) => {
      /* eslint-disable no-param-reassign */
      history.semesterName = semesterNames[history.Semester - 1];
      history.examStr = examStr(history.ExamDate);
      if (history.examStr) {
        history.examDateStr = history.examStr.slice(0, 10);
        history.examTimeStr = history.examStr.slice(11);
      }
      /* eslint-enable no-param-reassign */

      const timetable = history.Timetable;
      if (timetable) {
        let timetableTypes = [];
        _.each(timetable, (lesson) => {
          if (timetableTypes.indexOf(lesson.LessonType) < 0) {
            timetableTypes.push(lesson.LessonType);
          }
        });

        const AVAILABLE_TYPES = [
          'Lecture',
          'Sectional Teaching',
          'Seminar-Style Module Class',
          'Packaged Lecture',
          'Packaged Tutorial',
          'Tutorial',
          'Tutorial Type 2',
          'Tutorial Type 3',
          'Design Lecture',
          'Laboratory',
          'Recitation'
        ];

        const PLURALIZED_LESSON_TYPES = {
          Lecture: 'Lectures',
          'Sectional Teaching': 'Sectional Teachings',
          'Seminar-Style Module Class': 'Seminar-Style Module Classes',
          'Packaged Lecture': 'Packaged Lectures',
          'Packaged Tutorial': 'Packaged Tutorials',
          Tutorial: 'Tutorials',
          'Tutorial Type 2': 'Tutorial Type 2',
          'Tutorial Type 3': 'Tutorial Type 3',
          'Design Lecture': 'Design Lectures',
          Laboratory: 'Laboratories',
          Recitation: 'Recitations'
        };

        timetableTypes = _.sortBy(timetableTypes, (type) => (
          AVAILABLE_TYPES.indexOf(type)
        ));

        const formattedTimetable = [];
        _.each(timetableTypes, (type) => {
          let lessons = _.filter(timetable, (lesson) => (
            lesson.LessonType === type
          ));
          lessons = _.sortBy(lessons, (lesson) => {
            // The default sort is alphabetical, which is not ideal becase
            // classes appear in this order: T1, T10, T2, T3, ...
            // Hence pad with zero then sort alphabetically (assuming < 100 classes)
            const result = lesson.ClassNo.match(/\d/);
            if (!result) {
              return lesson.ClassNo;
            }
            const alpha = lesson.ClassNo.substring(0, result.index);
            let number = parseInt(lesson.ClassNo.slice(result.index), 10);
            if (number < 10) {
              number = `0${number.toString()}`;
            }
            return alpha + number;
          });
          formattedTimetable.push({
            LessonType: PLURALIZED_LESSON_TYPES[type],
            Lessons: lessons
          });
        });

        history.formattedTimetable = formattedTimetable; // eslint-disable-line no-param-reassign
      }
    });

    const corsBiddingStats = this.get('CorsBiddingStats');
    if (corsBiddingStats) {
      const formattedCorsBiddingStats = [];

      const semesters = [];
      _.each(corsBiddingStats, (stats) => {
        // const sem = stats.AcadYear + ',' + stats.Semester;
        const sem = `${stats.AcadYear},${stats.Semester}`;
        if (semesters.indexOf(sem) < 0) {
          semesters.push(sem);
        }
      });

      _.each(semesters, (sem) => {
        const parts = sem.split(',');
        const acadYear = parts[0];
        const semester = parts[1];
        let stats = _.filter(corsBiddingStats, (stat) => (
          stat.AcadYear === acadYear && stat.Semester === semester
        ));

        stats = _.map(stats, (stat) => {
          stat = _.omit(stat, ['AcadYear', 'Semester']); // eslint-disable-line no-param-reassign
          return stat;
        });

        formattedCorsBiddingStats.push({
          Semester: `AY${acadYear} Sem ${semester}`,
          BiddingStats: stats
        });
      });
      this.set('FormattedCorsBiddingStats', formattedCorsBiddingStats);
    }

    this.on('change:ExamDate', () => {
      this.set('examStr', examStr(this.get('ExamDate')));
    });

    const types = this.get('Types');
    this.set('inCORS', types && types.indexOf('Not in CORS') === -1);

    this.set('CORSLink', config.corsUrl + this.get('ModuleCode'));
    this.set('IVLELink', config.ivleUrl.replace('<ModuleCode>', this.get('ModuleCode')));

    const modSemesterNames = [];
    this.set('hasExams', false);
    const history = this.get('History');
    if (history) {
      const semestersOffered = [
        { semester: 1, name: semesterNames[0] },
        { semester: 2, name: semesterNames[1] },
        { semester: 3, name: semesterNames[2] },
        { semester: 4, name: semesterNames[3] }];
      for (let i = 0; i < history.length; i++) {
        if (history[i].ExamDate) {
          this.set('hasExams', true);
        }
        const sem = history[i].Semester;
        modSemesterNames.push(semesterNames[sem - 1]);
        semestersOffered[sem - 1].offered = true;
      }
      this.set('semesterNames', modSemesterNames);
      this.set('semestersOffered', semestersOffered);
    }
  }
});
