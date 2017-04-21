"use strict";

var Component = Component || {}

/**********************
 * Position Component *
 **********************/
Component.Position = function Position (board, x, y) {
  this._board = board;
  this.x = x;
  this.y = y;
};

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

    return true;
  } else {
    return false;
  }
}


/**************************
 * PhaserSprite Component *
 **************************/
Component.PhaserSprite = function PhaserSprite (x, y, spriteName) {
  this.sprite = game.add.sprite(x * 30, y * 30, spriteName);
  this.sprite.width = 30;
  this.sprite.height = 30;
};

Component.PhaserSprite.prototype.cleanup = function () {
  this.sprite.destroy();
}


/*******************
 * Actor Component *
 *******************/
Component.Actor = function Actor (baseSpeed, ttl) {
  this.baseSpeed = baseSpeed;
  this.speed = baseSpeed;
  this.ttl = ttl || baseSpeed;
};

Component.Actor.prototype.isLive = function() {
  return this.ttl == 0;
}

Component.Actor.prototype.passTime = function(ticks) {
  var nextTTL = this.ttl - ticks;
  if (nextTTL < 0)  {
    throw new Error('Actor.passTime has passed more time than the TTL of this entity');
  }
  this.ttl = nextTTL;
}

Component.Actor.prototype.endTurn = function() {
  this.ttl = this.speed;
}


/********************
 * Player Component *
 ********************/
Component.Player = function Player () { },


/*******************
 * FoeAI Component *
 *******************/
Component.FoeAI = function FoeAI () { };

Component.FoeAI.prototype.buildPathTowards = function(board, tX, tY) {
  // I haven't yet read the closures section so I'm not sure if this is how
  // you're supposed to get the this when you're invoked from the outside call
  // site to point to the board object, other than this.
  //
  // Note that the current implementation doesn't save the path. Possible area
  // for improvement here.
  var astar = new ROT.Path.AStar(tX, tY, board.isPassable.bind(board));
  var acc = [];
  var accFn = function(nX, nY) { acc.push([nX, nY]); }
  astar.compute(this.owner.position.x, this.owner.position.y, accFn);

  return acc;
}

Component.FoeAI.prototype.pathTowards = function(board, x, y) {
  var path = this.buildPathTowards(board, x, y);
  if (path.length > 1) {
    var next = path[1];
    this.owner.position.step(next[0] - this.owner.position.x,
                             next[1] - this.owner.position.y);
  }
}

Component.FoeAI.prototype.fireProjectile = function(board, entityManager, tX, tY) {
  var x0 = this.owner.position.x;
  var y0 = this.owner.position.y;

  var projectile = entityManager.createEntity();

  entityManager.addComponent(projectile, Component.Position.bind(null, board, x0, y0));

  entityManager.addComponent(projectile, Component.Actor.bind(null, 50, 0));

  var sc = Component.PhaserSprite.bind(null, x0, y0, 'dreadnought');
  entityManager.addComponent(projectile, sc);

  // This is ridiculous.
  var path = Pattern.LinePath.Create(x0, y0, tX, tY);
  entityManager.addComponent(projectile, Component.ProjectileAI.bind(null, path));
}

Component.FoeAI.prototype.takeTurn = function(board, entityManager) {
  var player = entityManager.findPlayer();
  this.pathTowards(board, player.position.x, player.position.y);
  this.fireProjectile(board,
                      entityManager,
                      player.position.x,
                      player.position.y);
}


/**************************
 * ProjectileAI Component *
 **************************/
Component.ProjectileAI = function ProjectileAI (path) {
  this._path = path;
};

Component.ProjectileAI.prototype.takeTurn = function (entityManager) {
  var next = this._path.step();
  var moved = this.owner.position.step(next[0], next[1]);
  if (!moved) {
    entityManager.removeEntity(this.owner);
  }
}
