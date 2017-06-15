"use strict";

var Component = Component || {}

/**********************
 * Position Component *
 **********************/
Component.Position = function Position (board, x, y, blocksMovement) {
  this._board = board;
  this._x = x;
  this._y = y;

  // Can use assignment in function def in v6, but my browser doesn't support.
  if (blocksMovement == undefined) {
    this.blocksMovement = true;
  } else {
    this.blocksMovement = blocksMovement;
  }

  this._currentCoordinates = [this._x, this._y];
  this._lastCoordinates = this._currentCoordinates;
};

Component.Position.prototype.postAddComponent = function () {
  this._board.notifyAdded(this.owner, this.getCurrentCoordinates());
}

// TODO: Update to newer js, and use destructuring instead of this!
Component.Position.prototype.getX = function () {
  return this._x;
}

// TODO: Update to newer js, and use destructuring instead of this!
Component.Position.prototype.getY = function () {
  return this._y;
}

Component.Position.prototype.getCurrentCoordinates = function () {
  return this._currentCoordinates;
}

Component.Position.prototype.getLastCoordinates = function () {
  return this._lastCoordinates;
}

Component.Position.prototype.setCoordinates = function (coordinates) {
  this._x = coordinates[0];
  this._y = coordinates[1];
  this._lastCoordinates = this._currentCoordinates;
  this._currentCoordinates = [this._x, this._y];
  this._board.notifyMoved(this.owner);
  this.tryUpdateRenderPosition();
}

Component.Position.prototype.distanceToEntity = function (entity) {
  var targetCoordinates = entity.position.getCurrentCoordinates();
  var dx = this._x - targetCoordinates[0];
  var dy = this._y - targetCoordinates[1];
  return Math.sqrt(dx * dx + dy * dy);
}

Component.Position.prototype.tryUpdateRenderPosition = function () {
    // I'd prefer some way of tying the render position to the logical position
    // which is - well, not quite as stateful as this? I might want to go have a
    // look at the documentation. In my previous Python implementation there was
    // a render step where I myself derived the x/y of the rendered tile on
    // every call, but the examples Phaser shows don't follow that approach.
    //
    // Also this will probably change drastically when the camera enters the
    // equation!
    if (!!this.owner.phaserSprite) {
      this.owner.phaserSprite.sprite.x = this._x * 30;
      this.owner.phaserSprite.sprite.y = this._y * 30;
    }
}

Component.Position.prototype.step = function(x, y) {
  if (! (-1 <= x <= 1) || ! (-1 <= y <= 1)) {
    throw new Error('You cannot step more than one square');
  }
  var nX = this._x + x;
  var nY = this._y + y;
  if (this._board.isPassable(nX, nY)) {
    this.setCoordinates([nX, nY]);

    this.tryUpdateRenderPosition();

    return true;
  } else {
    return false;
  }
}


/**************************
 * PhaserSprite Component *
 **************************/
Component.PhaserSprite = function PhaserSprite (x, y, spriteName, foreground) {
  this.sprite = game.add.sprite(x * 30, y * 30, spriteName);
  this.sprite.width = 30;
  this.sprite.height = 30;

  if (foreground == undefined && foreground) {
    this.sprite.bringToTop();
  } else {
    this.sprite.sendToBack();
  }
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
  if (ttl == undefined) {
    this.ttl = baseSpeed;
  } else {
    this.ttl = ttl;
  }
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

  CreateMoveCommand : function(board, manager, dx, dy) {
    var cmd = Command.CreateCommand(Command.CommandTypes.MOVE);
    cmd.board = board;
    cmd.manager = manager;
    cmd.dx = dx;
    cmd.dy = dy;
    return cmd;
  }
};

Component.Player = function Player () { },

Component.Player.prototype.executeCommand = function(command) {
  if (command.commandType == Command.CommandTypes.MOVE) {
    // Add in an attack here
    this.owner.position.step(command.dx, command.dy);

    var inRadius = command.board.occupiersInRadius(this.owner.position.getCurrentCoordinates(),
                                                   5,
                                                   true);
    var foesInRadius = [...inRadius].filter(e => e.hasComponent(Component.FoeAI));
    if (foesInRadius.length > 0) {
      // TODO: Closest enemy in radius
      //
      // TODO: This is really, really silly; you're doing a lot of spreading of
      // sets/packaging sets. Investigate whether or not to use sets; Javascript
      // does not attempt to hold the same assurances as Clojure.
      var foe = foesInRadius[0];

      for (var e of this.owner.equipSpace.getEquipped()) {
        if (!!e.weapon) {
          var foeCoordinates = foe.position.getCurrentCoordinates();
          e.weapon.tryFire(command.board,
                           command.manager,
                           foeCoordinates,
                           foeCoordinates);
        }
      }
    }
    return true;
  }
  return false;
}


/***********************
 * Equipment Component *
 ***********************/
Component.Equipment = function Equipment () {
  this._equipper = null;
}

Component.Equipment.prototype.notifyEquipped = function (equipper) {
  this._equipper = equipper;
}

Component.Equipment.prototype.notifyUnequipped = function () {
  this._equipper = null;
}

Component.Equipment.prototype.getEquipper = function () {
  return this._equipper;
}


/************************
 * EquipSpace Component *
 ************************/
// Currently, the EquipSpace component has unlimited capacity!
Component.EquipSpace = function EquipSpace () {
  this._equipped = [];
}

Component.EquipSpace.prototype.equip = function (item) {
  if (!!item.equipment) {
    this._equipped.push(item);
    item.equipment.notifyEquipped(this.owner);
  } else {
    throw new Error('Cannot equip non-equipment Entity!');
  }
}

Component.EquipSpace.prototype.unequip = function (item) {
  var index = this._equippedItems.indexOf(item);

  if (index > -1) {
    this._equipped.splice(index, 1);
    item.equipment.notifyUnequipped();
  } else {
    throw new Error('Tried to remove entity not in list');
  }
}

Component.EquipSpace.prototype.getEquipped = function () {
  return this._equipped;
}

// Remember multi-arity function defs are Not A Thing in JS!
Component.EquipSpace.prototype.getEquippedAt = function (idx) {
  return this._equipped[idx];
}


/********************
 * Weapon Component *
 ********************/

Component.Weapon = function Weapon (gameRand, blueprint) {
  this.gameRand = gameRand;
  this.projSpeed = blueprint.speed;
  this.cooldown = blueprint.cooldown;
  this.spread = (blueprint.spread == undefined) ? 0 : blueprint.spread;
  this.numShots = (blueprint.numShots == undefined) ? 1 : blueprint.numShots;
  this.damage = blueprint.damage;
  this.projImage = blueprint.projImage;
  this.path = blueprint.path;

  this.ttl = 0;
};

Component.Weapon.prototype.singleShot = function(board, entityManager, tX, tY) {
  // TODO: A better spread implementation. This spread can actually cause
  // enemies to fire BEHIND themselves! That's how it was in the 7DRL, but I
  // should change that once feature parity is reached.
  var dX, dY;
  if (this.spread > 0) {
    dX = Rand.randomInt(this.gameRand, 0, this.spread * 2) - this.spread;
    dY = Rand.randomInt(this.gameRand, 0, this.spread * 2) - this.spread;
  } else {
    dX = 0;
    dY = 0;
  }

  EntityBuilder.createProjectile(board, entityManager, this, tX + dX, tY + dY);
}

Component.Weapon.prototype.tryFire = function(board, entityManager, tX, tY) {
  if (this.ttl == 0) {
    for (var i = 0; i < this.numShots; i++) {
      this.singleShot(board, entityManager, tX, tY);
    }
    this.ttl = this.cooldown;
  } else {
    this.ttl--;
  }
}


/*******************
 * FoeAI Component *
 *******************/
Component.FoeAI = function FoeAI (ai) {
  this.ai = ai;
};

Component.FoeAI.prototype.takeTurn = function(board, entityManager) {
  this.ai.takeTurn(this.owner, board, entityManager);
}


/**************************
 * ProjectileAI Component *
 **************************/
Component.ProjectileAI = function ProjectileAI (path) {
  this._path = path;
};

Component.ProjectileAI.prototype.positionAtTicksFromNow = function (ticks) {
  if (this.owner.actor.speed == 0) {
    var turns = 20;
  } else {
    var turns = Math.ceil((ticks - this.owner.actor.ttl) / this.owner.actor.speed);
  }
  if (turns > 0) {
    return this._path.project(turns)[turns - 1];
  } else {
    return this._path.currentPosition();
  }
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
      if (!!entity.position && entity.position.blocksMovement &&
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
  // I think this is what TypeScript is supposed to solve.
  if (hp == undefined || defense == undefined || power == undefined) {
    throw new Error('Parameter to Fighter missing!');
  }
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


/***********************
 * JumpPoint Component *
 ***********************/
Component.JumpPoint = function JumpPoint () {}
