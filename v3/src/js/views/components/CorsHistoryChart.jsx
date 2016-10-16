// @flow
import type { BiddingStat } from 'types/modules';

import React from 'react';
import _ from 'lodash';
import filter from 'lodash/fp/filter';
import map from 'lodash/fp/map';
import flow from 'lodash/fp/flow';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

type Props = {
  stats: Array<BiddingStat>
};

// TODO: Can't I access defined types in `BiddingStat`? i.e. `BiddingStat.Group`
function formatStats(
  stats: Array<BiddingStat>,
  round: string,
  group: string,
  faculty: string,
  studentType: string
) {
  // TODO: Review this please! Result of not using chain, not very sure if I did it right.
  const filteredStats = flow(
    filter(stat => stat.Round === round),
    filter(stat => stat.Group === group),
    filter(stat => stat.Faculty === faculty),
    filter(stat => stat.StudentAcctType === studentType),
    map(stat => ({
      semester: `${stat.AcadYear} Semester ${stat.Semester}`,
      highest: parseInt(stat.HighestBid, 10),
      lowest: parseInt(stat.LowestBid, 10),
      lowestSuccessful: parseInt(stat.LowestSuccessfulBid, 10),
    })),
  )(stats);

  return filteredStats.sort((a, b) => {
    if (a.semester.slice(0, 3) === b.semester.slice(0, 3)) {
      return a.semester.slice(-1) < b.semester.slice(-1) ? 1 : -1;
    }
    return a.semester.slice(0, 3) < b.semester.slice(0, 3) ? 1 : -1;
  });
}

function getStatFaculties(stats: Array<BiddingStat>) {
  const faculties = map(stat => stat.Faculty)(stats);
  return _.uniq(faculties);
}

function getStatGroups(stats: Array<BiddingStat>) {
  const groups = map(stat => stat.Group)(stats);
  return _.uniq(groups);
}

function getStatStudentTypes(stats: Array<BiddingStat>) {
  const studentTypes = map(stat => stat.StudentAcctType)(stats);
  return _.uniq(studentTypes);
}

function getStatRounds(stats: Array<BiddingStat>) {
  const rounds = map(stat => stat.Round)(stats);
  return _.uniq(rounds);
}

function CorsHistoryChart(props: Props) {
  const { stats } = props;

  const faculties = getStatFaculties(stats);
  const rounds = getStatRounds(stats);
  const groups = getStatGroups(stats);
  const studentTypes = getStatStudentTypes(stats);

  // TODO: Add selectors to select stat filters
  const data = formatStats(stats, rounds[0], groups[2], faculties[0], studentTypes[0]);

  // TODO: Remove hard-coded styles
  return (
    <div style={{ height: 400, width: '100%' }}>
      <h3>CORS Bidding Stats</h3>
      <ResponsiveContainer width="90%">
        <LineChart data={data}
          margin={{ top: 20, right: 30, bottom: 20 }}
        >
          <XAxis dataKey="semester" tick={false}/>
          <YAxis tick={{ stroke: '#69707a' }}/>
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="highest" stroke="#ff5138" strokeWidth="3" dot={false} />
          <Line type="monotone" dataKey="lowestSuccessful" stroke="#82ca9d" strokeWidth="3" dot={false} />
          <Line type="monotone" dataKey="lowest" stroke="blue" strokeWidth="3" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default CorsHistoryChart;
