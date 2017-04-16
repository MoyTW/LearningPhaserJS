"use strict";

// All components are assumed to have an "owner" property, injected when it's
// added to a class by the manager. I don't know how to properly express that
// expectation in JS, so I'm putting it in a comment here.
var Component = {

  Position : function Position (board, x, y) {
    this._board = board;
    this.x = x;
    this.y = y;
  },

  PhaserSprite : function PhaserSprite (x, y, spriteName) {
    this.sprite = game.add.sprite(x * 30, y * 30, spriteName);
    this.sprite.width = 30;
    this.sprite.height = 30;
  },

  Player : function Player () { },

  FoeAI : function FoeAI (board, position) {
    this._board = board;
    this._position = position;
  },

}

// Position

Component.Position.prototype.step = function(x, y) {
  if (! (-1 <= x <= 1) || ! (-1 <= y <= 1)) {
    throw new Error('You cannot step more than one square');
  }
  if (this._board.isPassable(this.x + x, this.y + y)) {
    this.x += x;
    this.y += y;

    // I'd prefer some way of tying the render position to the logical position
    // which is - well, not quite as stateful as this? I might want to go have a
    // look at the documentation. In my previous Python implementation there was
    // a render step where I myself derived the x/y of the rendered tile on
    // every call, but the examples Phaser shows don't follow that approach.
    //
    // Also this will probably change drastically when the camera enters the
    // equation!
    if (!!this.owner.phaserSprite) {
      this.owner.phaserSprite.sprite.x = this.x * 30;
      this.owner.phaserSprite.sprite.y = this.y * 30;
    }
  }
}

// FoeAI

Component.FoeAI.prototype.buildPathTowards = function(tX, tY) {
  // I am really confused by *why* "this" works like it does, because it
  // seems...well, unusual? in its semantics.
  //
  // Note that the current implementation doesn't save the path. Possible area
  // for improvement here.
  var astar = new ROT.Path.AStar(tX,
                                 tY,
                                 function(x, y) {
                                   return this._board.isPassable(x, y);
                                 }.bind(this));
  var acc = [];
  var accFn = function(nX, nY) { acc.push([nX, nY]); }
  astar.compute(this._position.x, this._position.y, accFn);

  return acc;
}

Component.FoeAI.prototype.pathTowards = function(x, y) {
  var path = this.buildPathTowards(x, y);
  if (path.length > 1) {
    var next = path[1];
    this._position.step(next[0] - this._position.x, next[1] - this._position.y);
  }
}
