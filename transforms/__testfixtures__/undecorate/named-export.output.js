import React from 'react';
import hoc1 from 'hoc1';

class UndecoratedThing extends React.Component {
  render() {
    return <div>Thing</div>;
  }
}

export const Thing = hoc1()(UndecoratedThing)
