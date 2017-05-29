"use strict";

var AI = {};

AI._BaseAI = {};

// That's a heck of a variable name!
AI._BaseAI.init_BaseAI = function (stopApproachDistance) {
  this.stopApproachDistance = stopApproachDistance;
}

AI._BaseAI.Create = function (stopApproachDistance) {
  var o = Object.create( AI._BaseAI );
  o.init_BaseAI(stopApproachDistance);
  return o;
}

AI._BaseAI._buildPathTowards = function(owner, board, tX, tY) {
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
  astar.compute(owner.position.x, owner.position.y, accFn);

  return acc;
}

AI._BaseAI._pathTowards = function(owner, path) {
  if (path.length > 1) {
    var next = path[1];
    owner.position.step(next[0] - owner.position.x, next[1] - owner.position.y);
  }
}

AI._BaseAI.takeTurn = function(owner, board, entityManager) {
  var playerPos = entityManager.findPlayer().position;

  // Movement
  var path = this._buildPathTowards(owner, board, playerPos.x, playerPos.y);
  if (path.length > this.stopApproachDistance) {
    this._pathTowards(owner, path);
  }

  // Fire All Weapons
  if (!!owner.equipSpace) {
    for (var e of owner.equipSpace.getEquipped()) {
      if (!!e.weapon) {
        e.weapon.tryFire(board, entityManager, playerPos.x, playerPos.y);
      }
    }
  }
}

AI.ParameterizedAI = Object.create( AI._BaseAI );

AI.ParameterizedAI.initParameterizedAI = function (aiParams) {
  this.stopApproachDistance = aiParams.stopApproachDistance;
  this.weaponGroups = aiParams.weaponGroups;
  if (aiParams.moveCooldown) {
    this.moveCooldown = aiParams.moveCooldown;
    this.moveTTL = 0;
  }
}

AI.ParameterizedAI.Create = function (aiParams) {
  var o = Object.create( AI.ParameterizedAI );
  o.initParameterizedAI(aiParams);
  return o;
}

AI.ParameterizedAI.takeTurn = function(owner, board, entityManager) {
  var playerPos = entityManager.findPlayer().position;
  var path = this._buildPathTowards(owner, board, playerPos.x, playerPos.y);

  // Movement
  if (!this.moveCooldown && path.length > this.stopApproachDistance) {
    this._pathTowards(owner, path);
  } else if (!!this.moveCooldown && this.moveTTL == 0 && path.length > this.stopApproachDistance) {
    this._pathTowards(owner, path);
    this.moveTTL = this.moveCooldown;
  } else {
    this.moveTTL--;
  }

  for (var weaponGroup of this.weaponGroups) {
    var fired = false;
    for (var weaponInfo of weaponGroup) {
      // TODO: Figure out whether you want to have checks at the bottom or top
      // of your parameters, and use that consistently!
      var range = (!!weaponInfo.range) ? weaponInfo.range : 9999;
      if (!fired && weaponInfo.ttl == 0 && path.length <= range) {
        for (var weaponSlot of weaponInfo.slots) {
          var weaponEntity = owner.equipSpace.getEquippedAt(weaponSlot);
          weaponEntity.weapon.tryFire(board, entityManager, playerPos.x, playerPos.y);
          weaponInfo.ttl = weaponInfo.cooldown;
          fired = true;
        }
      } else {
        if (!!weaponInfo.ttl && weaponInfo.ttl > 0) {
          weaponInfo.ttl--;
        }
      }
    }
  }
}
