'use strict';

var React = require("react");

//stylesheet
require('spinkit/scss/spinners/8-circle.scss');

/**
* Spinner - Component based on spinkit, see <http://tobiasahlin.com/spinkit/>
* @constructor
*/
var Spinner = React.createClass({
  render: function() {
    return(
      <div className="spinner sk-circle">
        <div className="sk-circle1 sk-child"></div>
        <div className="sk-circle2 sk-child"></div>
        <div className="sk-circle3 sk-child"></div>
        <div className="sk-circle4 sk-child"></div>
        <div className="sk-circle5 sk-child"></div>
        <div className="sk-circle6 sk-child"></div>
        <div className="sk-circle7 sk-child"></div>
        <div className="sk-circle8 sk-child"></div>
        <div className="sk-circle9 sk-child"></div>
        <div className="sk-circle10 sk-child"></div>
        <div className="sk-circle11 sk-child"></div>
        <div className="sk-circle12 sk-child"></div>
      </div>);
  }
});

module.exports = Spinner;
