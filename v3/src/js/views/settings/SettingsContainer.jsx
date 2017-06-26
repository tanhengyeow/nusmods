// @flow
import type { Faculty } from 'types/modules';

import React from 'react';
import { connect } from 'react-redux';
import DocumentTitle from 'react-document-title';
import config from 'config';

import { selectTheme } from 'actions/theme';
import { selectNewStudent, selectFaculty } from 'actions/settings';
import availableThemes from 'data/themes.json';
import FacultySelect from 'views/components/FacultySelect';
import NewStudentSelect from 'views/components/NewStudentSelect';

import ThemeOption from './ThemeOption';

type Props = {
  newStudent: boolean,
  faculty: Faculty,
  currentThemeId: string,

  selectTheme: Function,
  selectNewStudent: Function,
  selectFaculty: Function,
};

function SettingsContainer(props: Props) {
  return (
    <DocumentTitle title={`Settings - ${config.brandName}`}>
      <div className="settings-page-container page-container">
        <div className="row">
          <div className="col-md-8 offset-md-1">
            <h1 className="page-title">Settings</h1>
            <h4>Theme</h4>
            <div>
              {availableThemes.map((theme) => {
                return (
                  <div className="theme-option-container"key={theme.id}>
                    <ThemeOption theme={theme}
                      isSelected={props.currentThemeId === theme.id}
                      onSelectTheme={props.selectTheme}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DocumentTitle>
  );
}

function mapStateToProps(state) {
  return {
    newStudent: state.settings.newStudent,
    faculty: state.settings.faculty,
    currentThemeId: state.theme.id,
  };
}

export default connect(
  mapStateToProps,
  {
    selectTheme,
    selectNewStudent,
    selectFaculty,
  },
)(SettingsContainer);
