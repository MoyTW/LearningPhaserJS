"use strict";

var EntityBuilder = {}

EntityBuilder.createPlayer = function (board, manager, x, y) {
  var player = manager.createEntity();

  manager.addComponent(player, Component.Player);

  manager.addComponent(player, Component.Actor.bind(null, 100));

  manager.addComponent(player, Component.Position.bind(null, board, x, y));

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'skiff');
  manager.addComponent(player, cSprite);

  manager.addComponent(player, Component.Fighter.bind(null, 15, 0, 5));

  manager.addComponent(player, Component.Weapon.bind(null, 0));

  var onPlayerDestroyed = function () { game.state.start('GameOver'); }
  var cd = Component.Destroyable.bind(null, manager,onPlayerDestroyed)
  manager.addComponent(player, cd);

  return player;
}

EntityBuilder.createDreadnought = function (board, manager, x, y) {
  var created = manager.createEntity();

  manager.addComponent(created, Component.Position.bind(null, board, x, y));

  manager.addComponent(created, Component.Actor.bind(null, 200));

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'dreadnought');
  manager.addComponent(created, cSprite);

  manager.addComponent(created, Component.FoeAI);

  manager.addComponent(created, Component.Fighter.bind(null, 10, 0, 2));

  manager.addComponent(created, Component.Weapon.bind(null, 50));

  manager.addComponent(created, Component.Destroyable.bind(null, manager));

  return created;
}

EntityBuilder.createSatellite = function (board, manager, x, y) {
  var satellite = manager.createEntity();

  var cPosition = Component.Position.bind(null, board, x, y, true);
  manager.addComponent(satellite, cPosition);

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'satellite');
  manager.addComponent(satellite, cSprite);

  var cFighter = Component.Fighter.bind(null, 15, 0, 5);
  manager.addComponent(satellite, cFighter);

  var cDestroyable = Component.Destroyable.bind(null, manager);
  manager.addComponent(satellite, cDestroyable);

  return satellite;
}

EntityBuilder.createLineProjectile = function (board, manager, x0, y0, x1, y1, speed) {
  var projectile = manager.createEntity();

  var cp = Component.Position.bind(null, board, x0, y0, false);
  manager.addComponent(projectile, cp);

  manager.addComponent(projectile, Component.Actor.bind(null, speed, 0));

  var sc = Component.PhaserSprite.bind(null, x0, y0, 'bullet');
  manager.addComponent(projectile, sc);

  // This is ridiculous.
  var path = Pattern.LinePath.Create(x0, y0, x1, y1);
  manager.addComponent(projectile, Component.ProjectileAI.bind(null, path));

  manager.addComponent(projectile, Component.Fighter.bind(null, 1, 0, 1));
  manager.addComponent(projectile, Component.Destroyable.bind(null, manager));

  return projectile;
};
