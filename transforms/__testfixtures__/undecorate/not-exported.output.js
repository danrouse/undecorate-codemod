import React from 'react';
import Relay from 'react-relay';
import hoc1 from 'hoc1';

class UndecoratedThing extends React.Component {
  render() {
    return <div>Thing</div>;
  }
}

const Thing = hoc1('my-param')(UndecoratedThing)

export default Relay.createContainer(Thing, {});
