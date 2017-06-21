// @flow
import type {Faculty} from 'types/modules';
import {Link} from 'react-router';

import React, { Component } from 'react';
import {connect} from 'react-redux';
import DocumentTitle from 'react-document-title';
import {modulePagePath} from 'utils/modules';
import type {ModuleCondensed} from 'types/modules';


type Props = {
  newStudent: boolean,
  faculty: Faculty,
  currentThemeId: string,

  selectTheme: Function,
  selectNewStudent: Function,
  selectFaculty: Function,
};



function FacultyContainer (props: { moduleList: Array<ModuleCondensed> })  {
  var fac = 'ACC';

  return (

    <DocumentTitle title={`NUSModsWiki`}>
      <div className="page-container">
        <div className="row">
          <button type="button"
                  className="btn btn-outline-primary" onClick={fac = 'ACC'}>
            Accounting
          </button>
          <button type="button"
                  className="btn btn-outline-primary" onClick={fac = 'CS'}>
            Computing
          </button>
        </div>
        <hr />
        <div >
          {props.moduleList.map((module) => {
            return (
              (module.ModuleCode.includes(fac)) &&
              <div key={module.ModuleCode}>
                <Link to={modulePagePath(module.ModuleCode)}>
                  {module.ModuleCode} {module.ModuleTitle}
                </Link>
                <hr />
              </div>
            );
          })}
        </div>
      </div>

    </DocumentTitle>
  );
}

function mapStateToProps(state) {
  return {
    moduleList: state.entities.moduleBank.moduleList,
  };
}
export default connect(
  mapStateToProps,
)(FacultyContainer);

