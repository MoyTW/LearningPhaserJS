"use strict";

var AI = {};

AI.BaseAI = {};

// That's a heck of a variable name!
AI.BaseAI.initBaseAI = function (stopApproachDistance) {
  this.stopApproachDistance = stopApproachDistance;
}

AI.BaseAI.Create = function (stopApproachDistance) {
  var o = Object.create( AI.BaseAI );
  o.initBaseAI(stopApproachDistance);
  return o;
}

AI.BaseAI._buildPathTowards = function(owner, board, tX, tY) {
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

AI.BaseAI._pathTowards = function(owner, path) {
  if (path.length > 1) {
    var next = path[1];
    owner.position.step(next[0] - owner.position.x, next[1] - owner.position.y);
  }
}

AI.BaseAI.takeTurn = function(owner, board, entityManager) {
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

AI.GunshipAI = Object.create( AI.BaseAI );

// TOOD: Work out an AI framework that is not hard-coded behaviour for each
// different opponent!
AI.GunshipAI.Create = function () {
  var o = Object.create( AI.GunshipAI );
  o.initBaseAI(5);
  o.initGunshipAI();
  return o;
}

AI.GunshipAI.initGunshipAI = function () {
  this.shouldMove = true;
  // This is SUPER DUPER FRAGILE
  // It relies on the *slots* weapons are stuck in!
  this.weaponGroups = [
    [
      // cooldown & ttl not strict necessary!
      {slot: 1, priority: 0, group: 0, cooldown: 4, ttl: 0},
      {slot: 0, priority: 1, group: 0, cooldown: 0, ttl: 0}
    ]
  ]
}

AI.GunshipAI.takeTurn = function(owner, board, entityManager) {
  var playerPos = entityManager.findPlayer().position;

  // Movement
  var path = this._buildPathTowards(owner, board, playerPos.x, playerPos.y);
  if (this.shouldMove && path.length > this.stopApproachDistance) {
    this._pathTowards(owner, path);
    this.shouldMove = false;
  } else {
    this.shouldMove = true;
  }

  for (var weaponGroup of this.weaponGroups) {
    var fired = false;
    for (var weaponInfo of weaponGroup) {
      if (!fired && weaponInfo.ttl == 0) {
        var weaponEntity = owner.equipSpace.getEquippedAt(weaponInfo.slot);
        weaponEntity.weapon.tryFire(board, entityManager, playerPos.x, playerPos.y);
        weaponInfo.ttl = weaponInfo.cooldown;
        fired = true;
      } else {
        if (!!weaponInfo.ttl && weaponInfo.ttl > 0) {
          weaponInfo.ttl--;
        }
      }
    }
  }

}
