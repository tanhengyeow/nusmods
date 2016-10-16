// @flow
/* eslint-disable no-duplicate-imports */
import type {
  ThemeState,
  TimetableOrientation,
} from 'types/reducers';
import {
  HORIZONTAL,
} from 'types/reducers';
import type {
  ModifiableLesson,
  Lesson,
  Module,
  ModuleCondensed,
  RawLesson,
} from 'types/modules';
import type { SemTimetableConfig, TimetableArrangement } from 'types/timetables';

import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import autobind from 'react-autobind';
import _ from 'lodash';
import config from 'config';
import classnames from 'classnames';
import { getSemModuleSelectList } from 'reducers/entities/moduleBank';
import domtoimage from 'dom-to-image';
import {
  addModule,
  cancelModifyLesson,
  changeLesson,
  modifyLesson,
  removeModule,
} from 'actions/timetables';
import { toggleTimetableOrientation } from 'actions/theme';
import { getModuleTimetable, areLessonsSameClass } from 'utils/modules';
import {
  timetableLessonsArray,
  hydrateSemTimetableWithLessons,
  arrangeLessonsForWeek,
  areOtherClassesAvailable,
  lessonsForLessonType,
} from 'utils/timetables';
import ModulesSelect from 'views/components/ModulesSelect';

import Timetable from './Timetable';
import TimetableModulesTable from './TimetableModulesTable';

type Props = {
  semester: number,
  semModuleList: Array<ModuleCondensed>,
  semTimetableWithLessons: SemTimetableConfig,
  modules: Module,
  theme: string,
  colors: ThemeState,
  activeLesson: ModifiableLesson,
  timetableOrientation: TimetableOrientation,

  addModule: Function,
  removeModule: Function,
  modifyLesson: Function,
  changeLesson: Function,
  cancelModifyLesson: Function,
  toggleTimetableOrientation: Function,
};

export class TimetableContainer extends Component {
  constructor(props: Props) {
    super(props);
    autobind(this);
  }

  componentWillUnmount() {
    this.props.cancelModifyLesson();
  }

  timetable: any;

  modifyCell(lesson: ModifiableLesson) {
    if (lesson.isAvailable) {
      this.props.changeLesson(this.props.semester, lesson);
    } else if (lesson.isActive) {
      this.props.cancelModifyLesson();
    } else {
      this.props.modifyLesson(lesson);
    }
  }

  downloadTimetable(format: string, size: string, orientation: string) {
    // Use ReactDOM to get the DOM of timetable node
    const timetable = this.timetable;

    let height = 0;
    let width = 0;

    switch (size) {
      case 'lg':
        height = 700;
        width = 1125;
        break;
      case 'md':
        break;
      case 'sm':
        break;
      default:
        return;
    }

    if (orientation === 'vertical') {
      [height, width] = [width, height];
    }

    const style = { paddingTop: '40px', marginLeft: '10px', marginRight: '10px' };

    switch (format) {
      case 'jpeg':
        domtoimage.toJpeg(timetable, { height: 1000, width: 1600, style, bgcolor: '#fff' })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = 'timetable.jpeg';
            link.href = dataUrl;
            link.click();
          });
        break;
      case 'png':
        break;
      case 'pdf':
        break;
      case 'excel':
        break;
      case 'ical':
        break;
      default:
        return;
    }
  }

  render() {
    let timetableLessons: Array<Lesson | ModifiableLesson> = timetableLessonsArray(this.props.semTimetableWithLessons);
    if (this.props.activeLesson) {
      const activeLesson = this.props.activeLesson;
      const moduleCode = activeLesson.ModuleCode;

      const module = this.props.modules[moduleCode];
      const moduleTimetable: Array<RawLesson> = getModuleTimetable(module, this.props.semester);
      const lessons = lessonsForLessonType(moduleTimetable, activeLesson.LessonType)
        .map((lesson) => {
          // Inject module code in
          return { ...lesson, ModuleCode: moduleCode };
        });
      const otherAvailableLessons = lessons
        .filter((lesson) => {
          // Exclude the lesson being modified.
          return !areLessonsSameClass(lesson, activeLesson);
        })
        .map((lesson) => {
          return { ...lesson, isAvailable: true };
        });
      timetableLessons = timetableLessons.map((lesson) => {
        // Identify the current lesson being modified.
        if (areLessonsSameClass(lesson, activeLesson)) {
          return { ...lesson, isActive: true };
        }
        return lesson;
      });
      timetableLessons = [...timetableLessons, ...otherAvailableLessons];
    }

    // Inject color index into lessons.
    timetableLessons = timetableLessons.map((lesson) => {
      return { ...lesson, colorIndex: this.props.colors[lesson.ModuleCode] };
    });

    const arrangedLessons: TimetableArrangement = arrangeLessonsForWeek(timetableLessons);
    const arrangedLessonsWithModifiableFlag: TimetableArrangement = _.mapValues(arrangedLessons, (dayRows) => {
      return dayRows.map((row) => {
        return row.map((lesson) => {
          const module: Module = this.props.modules[lesson.ModuleCode];
          const moduleTimetable: Array<RawLesson> = getModuleTimetable(module, this.props.semester);
          return {
            ...lesson,
            isModifiable: areOtherClassesAvailable(moduleTimetable, lesson.LessonType),
          };
        });
      });
    });

    const isHorizontalOrientation = this.props.timetableOrientation === HORIZONTAL;

    return (
      <DocumentTitle title={`Timetable - ${config.brandName}`}>
        <div className={`theme-${this.props.theme} timetable-page-container page-container`} onClick={() => {
          if (this.props.activeLesson) {
            this.props.cancelModifyLesson();
          }
        }}>
          <div className="row">
            <div className={classnames('timetable-wrapper', {
              'col-md-12': isHorizontalOrientation,
              'col-md-8': !isHorizontalOrientation,
            })}
          >
              <div ref={(ref) => { this.timetable = ref; }}>
                <Timetable lessons={arrangedLessonsWithModifiableFlag}
                  horizontalOrientation={isHorizontalOrientation}
                  onModifyCell={this.modifyCell}
                />
              </div>
              <br/>
            </div>
            <div className={classnames({
              'col-md-12': isHorizontalOrientation,
              'col-md-4': !isHorizontalOrientation,
            })}>
              <div className="timetable-action-row text-xs-right">
                <button type="button"
                  className="btn btn-outline-primary"
                  onClick={this.props.toggleTimetableOrientation}
                >
                  <i className="fa fa-exchange"/>
                </button>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <ModulesSelect moduleList={this.props.semModuleList}
                    onChange={(moduleCode) => {
                      this.props.addModule(this.props.semester, moduleCode.value);
                    }}
                    placeholder="Add module to timetable"
                  />
                  <br/>
                  <TimetableModulesTable modules={
                    Object.keys(this.props.semTimetableWithLessons).sort((a, b) => {
                      return a.localeCompare(b);
                    }).map((moduleCode) => {
                      const module = this.props.modules[moduleCode] || {};
                      // Inject color index.
                      module.colorIndex = this.props.colors[moduleCode];
                      return module;
                    })}
                    horizontalOrientation={isHorizontalOrientation}
                    semester={this.props.semester}
                    onRemoveModule={(moduleCode) => {
                      this.props.removeModule(this.props.semester, moduleCode);
                    }}
                  />
                </div>

                <div className="col-md-2">
                  <button type="button"
                    className="btn btn-outline-primary"
                    onClick={this.props.toggleTimetableOrientation}
                  >
                    <i className="fa fa-exchange"/>
                  </button>
                  <button type="button"
                    className="btn btn-outline-primary"
                    onClick={() => this.downloadTimetable('jpeg', 'lg', 'horizontal')}
                  >
                    <i className="fa fa-download" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DocumentTitle>
    );
  }
}

TimetableContainer.contextTypes = {
  router: PropTypes.object,
};

function mapStateToProps(state) {
  const modules = state.entities.moduleBank.modules;
  const semester = config.semester;
  const semTimetable = state.timetables[semester] || {};
  const semModuleList = getSemModuleSelectList(state.entities.moduleBank, semester, semTimetable);
  const semTimetableWithLessons = hydrateSemTimetableWithLessons(semTimetable, modules, semester);

  return {
    semester,
    semModuleList,
    semTimetableWithLessons,
    modules,
    activeLesson: state.app.activeLesson,
    theme: state.theme.id,
    colors: state.theme.colors,
    timetableOrientation: state.theme.timetableOrientation,
  };
}

export default connect(
  mapStateToProps,
  {
    addModule,
    removeModule,
    modifyLesson,
    changeLesson,
    cancelModifyLesson,
    toggleTimetableOrientation,
  }
)(TimetableContainer);
