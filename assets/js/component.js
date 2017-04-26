"use strict";

var Component = Component || {}

/**********************
 * Position Component *
 **********************/
Component.Position = function Position (board, x, y, blocks_movement) {
  this._board = board;
  this.x = x;
  this.y = y;

  // Can use assignment in function def in v6, but my browser doesn't support.
  if (blocks_movement = 'undefined') {
    this.blocks_movement = true;
  } else {
    this.blocks_movement = blocks_movement;
  }
};

Component.Position.prototype.asArray = function () {
  return [this.x, this.y];
}

Component.Position.prototype.distanceTo = function (entity) {
  return this.distanceTo(entity.position.x, entity.position.y);
}

Component.Position.prototype.distanceTo = function (x, y) {
  var dx = this.x - x;
  var dy = this.y - y;
  return Math.sqrt(dx * dx + dy * dy);
}

Component.Position.prototype.step = function(x, y) {
  if (! (-1 <= x <= 1) || ! (-1 <= y <= 1)) {
    throw new Error('You cannot step more than one square');
  }
  var nX = this.x + x;
  var nY = this.y + y;
  if (this._board.isPassable(nX, nY)) {
    this._board.notifyMoved(this.owner, [this.x, this.y], [nX, nY]);
    this.x = nX;
    this.y = nY;

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
// TODO: Move into own file & possibly rename
var Command = Command || {
  CommandTypes : Object.freeze({
    MOVE: 'move'
  }),

  Command : {},

  CreateCommand : function(commandType) {
    var cmd = Object.create( Command.Command );
    cmd.commandType = commandType;
    return cmd;
  },

  CreateMoveCommand : function(dx, dy) {
    var cmd = Command.CreateCommand(Command.CommandTypes.MOVE);
    cmd.dx = dx;
    cmd.dy = dy;
    return cmd;
  }
};

Component.Player = function Player () { },

Component.Player.prototype.executeCommand = function(command) {
  if (command.commandType == Command.CommandTypes.MOVE) {
    this.owner.position.step(command.dx, command.dy);
    return true;
  }
  return false;
}


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
  //
  // Further note that the current implementation does not path around blocking
  // entities. This is a hack, because the player's a blocking entity, and so if
  // you pass in isPassable, it makes it impossible to path to the square of the
  // player.
  var astar = new ROT.Path.AStar(tX, tY, board.isTerrainPassable.bind(board));
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

  var tagFn = entityManager.replaceTagFn();
  var cp = Component.Position.bind(null, board, x0, y0, tagFn, false);
  entityManager.addComponent(projectile, cp);

  entityManager.addComponent(projectile, Component.Actor.bind(null, 50, 0));

  var sc = Component.PhaserSprite.bind(null, x0, y0, 'bullet');
  entityManager.addComponent(projectile, sc);

  // This is ridiculous.
  var path = Pattern.LinePath.Create(x0, y0, tX, tY);
  entityManager.addComponent(projectile, Component.ProjectileAI.bind(null, path));

  entityManager.addComponent(projectile, Component.Fighter.bind(null, 1, 0, 1));
  entityManager.addComponent(projectile,
                             Component.Destroyable.bind(null, entityManager));
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

Component.ProjectileAI.prototype.takeTurn = function (board) {
  var next = this._path.step();
  var moved = this.owner.position.step(next[0], next[1]);
  // This is really just UGLY, what with all the 'exists' checking I'm doing
  // here. I'm somewhat influenced by how common nil punning is in Clojure, so
  // there might be a cleaner js-style method of doing that kind of logic. Gosh,
  // I hope there is.
  if (!moved) {
    for (let entity of board.tileOccupiers(this._path.currentPosition())) {
      if (!!entity.position && entity.position.blocks_movement &&
          !!entity.fighter) {
        this.owner.fighter.attack(entity);
        break;
      }
    }
    this.owner.destroyable.notifyDestroyed();
  }
}


/**************************
 * Fighter Component *
 **************************/
Component.Fighter = function Fighter (hp, defense, power) {
  // Right now, no Attribute-style class to track bonus/malus; later maybe
  this.baseMaxHP = hp;
  this.maxHP = hp;
  this.hp = hp;

  this.baseDefense = defense;
  this.defense = defense;

   // Power is unused; placeholder
  this.basePower = power;
  this.power = power;
}

Component.Fighter.prototype.takeDamage = function (damage) {
  this.hp -= damage;

  if (this.hp <= 0) {
    this.owner.destroyable.notifyDestroyed();
  }
}

Component.Fighter.prototype.attack = function (target) {
  var damage = this.power - target.fighter.defense;
  if (damage > 0) {
    target.fighter.takeDamage(damage);
  }
  return damage;
}


/**************************
 * Destroyable Component *
 **************************/
Component.Destroyable = function Destroyable (entityManager, onDestroyedCallback) {
  this._entityManager = entityManager;
  this.onDestroyedCallback = onDestroyedCallback;
}

Component.Destroyable.prototype.notifyDestroyed = function () {
  if (this.onDestroyedCallback) { this.onDestroyedCallback(); }
  this._entityManager.removeEntity(this.owner);
}
