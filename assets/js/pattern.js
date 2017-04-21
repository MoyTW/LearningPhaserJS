"use strict";

/* Ok, so, heads up. This might look pretty incomprehensible, because it's not
 * attempting to use class-based systems. Instead, it's attempting to use 'OLOO'
 * which is from You Don't Know Javascript. See Chapter 6 of "this & Object
 * Prototypes" here:
 * https://github.com/getify/You-Dont-Know-JS/blob/master/this%20%26%20object%20prototypes/ch6.md
 */

var Pattern = Pattern || {};


/********
 * Path *
 ********/
Pattern.Path = {
  // I don't feel that the "OLOO" design handles this well! You have to make a
  // unique "initX" for all your different classes, and then link them together
  // manually instead of having the class structure, uh, do that.
  //
  // To be fair, javascript strictly speaking doesn't *have* a class structure.
  initPath : function(x0, y0, stepFn) {
    this._currentStep = 0;
    this._stepFn = stepFn;
    this._path = [[x0, y0]];
  },

  currentPosition : function () {
    return this._path[this._currentStep];
  },

  lastPosition : function () {
    return this._path[this._currentStep - 1];
  },

  currentStepDiff : function() {
    if (this._currentStep > 0) {
      var pCurrent = this.currentPosition();
      var pLast = this.lastPosition();
      return [pCurrent[0] - pLast[0], pCurrent[1] - pLast[1]];
    } else {
      return [0, 0];
    }
  },

  step : function () {
    this._currentStep++;
    if (this._path.length <= this._currentStep) { this.calcSteps(1); }
    return this.currentStepDiff();
  },

  calcSteps : function (numSteps) {
    for (var i = 0; i < numSteps; i++) {
      this._path.push(this._stepFn());
    }
  },

  project : function (numSteps) {
    if (numSteps < 0) {
      throw new Error('Cannot project path by a negative number');
    }

    var numDesiredSteps = this._currentStep + numSteps;
    if (this._path.length <= numDesiredSteps) {
      this.calcSteps(numDesiredSteps - this._path.length);
    }

    return this._path.slice(this._currentStep, this._currentStep + numSteps);
  }
}

/******************
 * LinePath *
 ******************/
Pattern.LinePath = Object.create( Pattern.Path );

// I can work with constructor functions. I know how to do that.
Pattern.LinePath.Create = function(x0, y0, x1, y1) {
  var o = Object.create( Pattern.LinePath );
  o.initLinePath(x0, y0, x1, y1);
  return o;
}

Pattern.LinePath.initLinePath = function (x0, y0, x1, y1) {
  this.initPath(x0, y0, this.calcStep);
  this.x0 = x0;
  this.y0 = y0;
  this.x1 = x1;
  this.y1 = y1;

  if (x1 - x0 == 0) {
    this.vertical = true;
  } else {
    this.vertical = false;
    this.dErr = Math.abs((y1 - y0) / (x1 - x0));
  }

  this.error = 0.0;

  if (y1 - y0 > 0) {
    this.yErr = 1;
  } else {
    this.yErr = -1;
  }

  if (x1 - x0 > 0) {
    this.xDiff = 1;
  } else {
    this.xDiff = -1;
  }
}

Pattern.LinePath.calcStep = function () {
  var lastCalculatedPos = this._path[this._path.length - 1]
  var lastCalculatedX = lastCalculatedPos[0];
  var lastCalculatedY = lastCalculatedPos[1];
  if(this.vertical) {
    return [lastCalculatedX, lastCalculatedY + this.yErr];
  } else if (this.error >= 0.5) {
    this.error--;
    return [lastCalculatedX, lastCalculatedY + this.yErr];
  } else {
    this.error += this.dErr;
    return [lastCalculatedX + this.xDiff, lastCalculatedY];
  }
}
