// @flow
import type {Faculty} from 'types/modules';
import {Link} from 'react-router';

import React, { Component } from 'react';
import {connect} from 'react-redux';
import DocumentTitle from 'react-document-title';
import {modulePagePath} from 'utils/modules';
import type {ModuleCondensed} from 'types/modules';

export class FacultyPageContainer extends Component {
  props: { moduleList: Array<ModuleCondensed> };

  constructor() {
    super();

    this.state = {
      code: 'ACC'
    }
  }



  // changeCode(str: string) {
  //   console.log("dfgdfgfdgdfgdfg");
  //   this.setState({
  //     code: str
  // })}



  render(){

    return (

      <DocumentTitle title={`NUSModsWiki`}>
        <div className="page-container">
          <div className="row">
            <button type="button"
                    className="btn btn-outline-primary" >
              Accounting
            </button>
            <button type="button"
                    className="btn btn-outline-primary" >
              Computing
            </button>
          </div>
          <hr />
          <div >
            {this.props.moduleList.map((module) => {
              return (
                (module.ModuleCode.includes( 'ACC' )) &&
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
}



function mapStateToProps(state) {
  return {
    moduleList: state.entities.moduleBank.moduleList,
  };
}
export default connect(
  mapStateToProps,
)(FacultyPageContainer);

