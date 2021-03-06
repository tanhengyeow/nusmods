// @flow
import React, {Component} from 'react';
import {connect} from 'react-redux';
import DocumentTitle from 'react-document-title';
import config from 'config';

import {loadModule} from 'actions/moduleBank';
import {addModule, removeModule} from 'actions/timetables';
import type {Module} from 'types/modules';
import type {FetchRequest} from 'types/reducers';
import {formatExamDate} from 'utils/modules';
import type {TimetableConfig} from 'types/timetables';
import AddModuleButton from './AddModuleButton';
import RemoveModuleButton from './RemoveModuleButton';
import {RIEToggle, RIEInput, RIETextArea, RIENumber, RIETags, RIESelect} from 'riek'
import {Button} from 'react-bootstrap';
import AlertContainer from 'react-alert'


var firebase = require("firebase");
var firebaseconfig = {
  apiKey: 'AIzaSyD81H76yeEZNPu4EpRxclk70JvEh1tlG8c',
  authDomain: 'wiki-5a16a.firebaseapp.com',
  databaseURL: 'https://wiki-5a16a.firebaseio.com',
  storageBucket: 'wiki-5a16a.appspot.com',
};
firebase.initializeApp(firebaseconfig);


type RouteParams = {
  moduleCode: string,
};
type Props = {
  routeParams: RouteParams,
  module: Module,
  loadModule: Function,
  fetchModuleRequest: FetchRequest,
  timetables: TimetableConfig,
  addModule: Function,
  removeModule: Function,
};


export class ModulePageContainer extends Component {

  props: Props;

  constructor() {
    super();
    this.dataChanged = this.dataChanged.bind(this);
    //this.isStringAcceptable = this.isStringAcceptable.bind(this);

    this.state = {
      usefulLinks: '',
      feedbacks: '',
      projects: '',
      funFacts: '',
      highlight: true,
    };

    this.alertOptions = {
      offset: 14,
      position: 'top right',
      theme: 'light',
      time: 5000,
      transition: 'scale'
    }
  }


  componentDidMount() {
    this.loadModuleInformation(this.props);
  }

  componentWillReceiveProps(nextProps: Props) {
    if (nextProps.routeParams.moduleCode !== this.props.routeParams.moduleCode) {
      this.loadModuleInformation(nextProps);

      this.setState({
        usefulLinks: '',
        feedbacks: '',
        projects: '',
        funFacts: '',
        saveSuccess: '',
      });
    }
  }


  loadModuleInformation(props: Props) {
    this.props.loadModule(props.routeParams.moduleCode);
  }

  semestersOffered(): number[] {
    return this.props.module && this.props.module.History ? (
      this.props.module.History
        .sort((a, b) => a.Semester - b.Semester)
        .map(h => h.Semester))
      : [];
  }

  examinations(): {semester: number, date: string}[] {
    return this.props.module && this.props.module.History ? (
      this.props.module.History
        .filter(h => h.ExamDate != null)
        .sort((a, b) => a.Semester - b.Semester)
        .map(h => ({semester: h.Semester, date: h.ExamDate || ''})))
      : [];
  }

  moduleHasBeenAdded(module: Module, semester: number): boolean {
    if (!module) {
      return false;
    }
    const timetables = this.props.timetables;
    return timetables[semester] && !!timetables[semester][module.ModuleCode];
  }

  readUsefulLinks() {
    var ref = firebase.database().ref(this.props.module.ModuleCode + '/usefulLinks/');
    //console.log('asdsads' + this.state.usefulLinks + 'asd');
    ref.on('value', function (snapshot) {
      var obj = snapshot.val();

      this.setState({
        usefulLinks: snapshot.val()
      });

    }.bind(this));
  }


  readFeedbacks() {
    var ref = firebase.database().ref(this.props.module.ModuleCode + '/feedbacks/');

    ref.on('value', function (snapshot) {
      var obj = snapshot.val();

      this.setState({
        feedbacks: snapshot.val()
      });

    }.bind(this));
  }

  readProjects() {
    var ref = firebase.database().ref(this.props.module.ModuleCode + '/projects/');

    ref.on('value', function (snapshot) {
      var obj = snapshot.val();

      this.setState({
        projects: snapshot.val()
      });

    }.bind(this));
  }

  readFunFacts() {
    var ref = firebase.database().ref(this.props.module.ModuleCode + '/funFacts/');

    ref.on('value', function (snapshot) {
      var obj = snapshot.val();

      this.setState({
        funFacts: snapshot.val()
      });

    }.bind(this));
  }

  dataChanged(data) {
    // data = { description: "New validated text comes here" }
    // Update your model from here
    //console.log(data);
    this.setState({...data});
    // var ref = firebase.database().ref(this.props.module.ModuleCode + '/');
    //
    // ref.update({
    //   ...data
    // });
  }

  saveData() {
    var ref = firebase.database().ref(this.props.module.ModuleCode + '/');

    ref.update({
      usefulLinks: this.state.usefulLinks,
      feedbacks: this.state.feedbacks,
      projects: this.state.projects,
      funFacts: this.state.funFacts,
    });
    this.showSuccessAlert();
  }

  showSuccessAlert() {
    this.msg.show('Data have been saved', {
      type: 'success',
    })
  }


  render() {

    const module = this.props.module;
    const documentTitle = module ?
      `${module.ModuleCode} ${module.ModuleTitle} - ${config.brandName}` : 'Not found';
    const ivleLink = module ? config.ivleUrl.replace('<ModuleCode>', module.ModuleCode) : null;
    const corsLink = module ? `${config.corsUrl}${module.ModuleCode}` : null;

    const renderExaminations = this.examinations().map(exam =>
      <span key={exam.semester}>
        <dt className="col-sm-3">Semester {exam.semester} Exam</dt>
        <dd className="col-sm-9">{formatExamDate(exam.date)}</dd>
      </span>,
    );

    const semsOffered = this.semestersOffered()
      .map(sem => `Semester ${sem}`)
      .join(', ');


    const addOrRemoveToTimetableLinks = this.semestersOffered().map(
      semester => (
        this.moduleHasBeenAdded(module, semester) ?
          <RemoveModuleButton key={semester} semester={semester} onClick={() =>
            this.props.removeModule(semester, module.ModuleCode)
          }/>
          :
          <AddModuleButton key={semester} semester={semester} onClick={() =>
              this.props.addModule(semester, module.ModuleCode)
            }/>
      ),
    );


    return (
      <DocumentTitle title={documentTitle}>
        <div className="module-container">
          {this.props.fetchModuleRequest.isPending && !module ?
            <p>Loading...</p> : null
          }
          {this.props.fetchModuleRequest.isFailure ? <p>Module not found</p> : null}
          {this.props.fetchModuleRequest.isSuccessful || module ?
            <div>
              <h1 className="page-title">{module.ModuleCode} {module.ModuleTitle}</h1>
              <hr />
              <dl className="row">
                {module.ModuleDescription ? <dt className="col-sm-3">Description</dt> : null}
                {module.ModuleDescription ?
                  <dd className="col-sm-9">{module.ModuleDescription}</dd> : null}

                {module.ModuleCredit ? <dt className="col-sm-3">Module Credits (MCs)</dt> : null}
                {module.ModuleCredit ? <dd className="col-sm-9">{module.ModuleCredit}</dd> : null}

                {module.Prerequisite ? <dt className="col-sm-3">Prerequisite(s)</dt> : null}
                {module.Prerequisite ? <dd className="col-sm-9">{module.Prerequisite}</dd> : null}

                {module.Corequisite ? <dt className="col-sm-3">Corequisite(s)</dt> : null}
                {module.Corequisite ? <dd className="col-sm-9">{module.Corequisite}</dd> : null}

                {module.Preclusion ? <dt className="col-sm-3">Preclusion(s)</dt> : null}
                {module.Preclusion ? <dd className="col-sm-9">{module.Preclusion}</dd> : null}

                {module.Department ? <dt className="col-sm-3">Department</dt> : null}
                {module.Department ? <dd className="col-sm-9">{module.Department}</dd> : null}

                {module.Workload ? <dt className="col-sm-3">Weekly Workload</dt> : null}
                {module.Workload ? <dd className="col-sm-9">{module.Workload}</dd> : null}

                {renderExaminations}

                <dt className="col-sm-3">Semesters Offered</dt>
                <dd className="col-sm-9">{semsOffered}</dd>

                <dt className="col-sm-3">Official Links</dt>
                <dd className="col-sm-9">
                  <ul className="nm-footer-links">
                    {ivleLink ? <li><a href={ivleLink}>IVLE</a></li> : null}
                    {corsLink ? <li><a href={corsLink}>CORS</a></li> : null}
                  </ul>
                </dd>


              </dl>
              <hr />
              <dl className="row">

                <dt className="col-sm-3">Useful Links</dt>
                <dd className="col-sm-9" title="Click to edit!">{ this.state.usefulLinks !== '' ?
                  <RIETextArea rows="3" cols="80"
                               value={this.state.usefulLinks}
                               change={this.dataChanged}
                               propName='usefulLinks' className={this.state.highlight ? "editable" : ""}
                  /> : this.readUsefulLinks() }</dd>
              </dl>
              <dl className="row">
                <dt className="col-sm-3">Past lecturers/tutors feedback</dt>
                <dd className="col-sm-9" title="Click to edit!">{ this.state.feedbacks !== '' ?
                  <RIETextArea rows="3" cols="80"
                               value={this.state.feedbacks}
                               change={this.dataChanged}
                               propName='feedbacks' className={this.state.highlight ? "editable" : ""}
                  /> : this.readFeedbacks() }</dd>
              </dl>

              <dl className="row">
                <dt className="col-sm-3">Outstanding projects</dt>
                <dd className="col-sm-9" title="Click to edit!">{ this.state.projects !== '' ?
                  <RIETextArea rows="3" cols="80"
                               value={this.state.projects}
                               change={this.dataChanged}
                               propName='projects' className={this.state.highlight ? "editable" : ""}
                  /> : this.readProjects() }</dd>
              </dl>

              <dl className="row">
                <dt className="col-sm-3">Fun facts</dt>
                <dd className="col-sm-9" title="Click to edit!">{ this.state.funFacts !== '' ?
                  <RIETextArea rows="3" cols="80"
                               value={this.state.funFacts}
                               change={this.dataChanged}
                               propName='funFacts' className={this.state.highlight ? "editable" : ""}
                  /> : this.readFunFacts() }</dd>
              </dl>

              <Button onClick={()=>{ this.saveData() }} bsStyle="primary">Save</Button>
              <AlertContainer ref={a => this.msg = a} {...this.alertOptions}/>


            </div > : null
          }
        </div>
      </DocumentTitle>
    );
  }
}

function mapStateToProps(state, ownProps) {
  const timetables = state.timetables;
  return {
    module: state.entities.moduleBank.modules[ownProps.params.moduleCode],
    fetchModuleRequest: state.requests.fetchModuleRequest || {},
    timetables,
  };

}

export default connect(
  mapStateToProps,
  {
    addModule,
    loadModule,
    removeModule,
  },
)(ModulePageContainer);
