"use strict";

var AI = {};

AI.BaseAI = {};

AI.BaseAI.Create = function () {
  return Object.create( AI.BaseAI );
}

AI.BaseAI.buildPathTowards = function(owner, board, tX, tY) {
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

AI.BaseAI.pathTowards = function(owner, board, x, y) {
  var path = this.buildPathTowards(owner, board, x, y);
  if (path.length > 1) {
    var next = path[1];
    owner.position.step(next[0] - owner.position.x, next[1] - owner.position.y);
  }
}

AI.BaseAI.takeTurn = function(owner, board, entityManager) {
  var player = entityManager.findPlayer();
  this.pathTowards(owner, board, player.position.x, player.position.y);
  if (!!owner.equipSpace) {
    for (var e of owner.equipSpace.getEquipped()) {
      if (!!e.weapon) {
        e.weapon.fireProjectile(board,
                                entityManager,
                                player.position.x,
                                player.position.y);
      }
    }
  }
}
