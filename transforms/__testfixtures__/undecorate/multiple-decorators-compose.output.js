import React from 'react';
import withParam from 'withParam';
import hoc1 from 'hoc1';
import hoc2 from 'hoc2';
import taggedTemplate from 'taggedTemplate';

import {compose} from "test-compose-package";

const myParam = 'test';

class Thing extends React.Component {
  render() {
    return <div>Thing</div>;
  }
}

export default compose(
  withParam(myParam),
  hoc1,
  hoc2(),
  taggedTemplate`
    .thing {}
  `
)(Thing);
