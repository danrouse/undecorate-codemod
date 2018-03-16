import React from 'react';
import hoc1 from 'hoc1';

class Thing extends React.Component {
  render() {
    return <div>Thing</div>;
  }
}

export default hoc1('my-param')(Thing)
