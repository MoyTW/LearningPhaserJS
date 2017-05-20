"use strict";

var EntityBuilder = {}

EntityBuilder.loadImages = function () {
  game.load.image('scout', './assets/images/scout.png');
  game.load.image('fighter', './assets/images/fighter.png');
}

/******************************************************************************
 *                                  WEAPONS                                   *
 ******************************************************************************/
EntityBuilder.Weapons = {

  cuttingLaser : {
    damage: 0,
    speed: 0,
    cooldown: 0,
    spread: 0,
    numShots: 1
  },

  scoutShotgun : {
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 2,
    numShots: 3
  },

  smallGatling : {
    damage: 2,
    speed: 50,
    cooldown: 0,
    spread: 0,
    numShots: 1
  }
}

EntityBuilder.createWeaponEntity = function (manager, gameRand, params) {
  var e = manager.createEntity();

  manager.addComponent(e, Component.Equipment);
  manager.addComponent(e, Component.Weapon.bind(null,
                                                gameRand,
                                                params.speed,
                                                params.cooldown,
                                                params.spread,
                                                params.numShots,
                                                params.damage));

  return e;
}


/******************************************************************************
 *                                   SHIPS                                    *
 ******************************************************************************/
EntityBuilder.createBaseShip = function (board, manager, x, y) {
  var created = manager.createEntity();

  manager.addComponent(created, Component.Position.bind(null, board, x, y));

  manager.addComponent(created, Component.Destroyable.bind(null, manager));

  return created;
}

EntityBuilder.createScout = function (board, manager, gameRand, x, y) {
  var created = EntityBuilder.createBaseShip(board, manager, x, y);

  manager.addComponent(created, Component.Actor.bind(null, 75));

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'scout');
  manager.addComponent(created, cSprite);

  manager.addComponent(created, Component.FoeAI.bind(null, AI.BaseAI.Create(5)));

  manager.addComponent(created, Component.Fighter.bind(null, 10, 0, 2));

  manager.addComponent(created, Component.EquipSpace);
  created.equipSpace.equip(EntityBuilder.createWeaponEntity(manager, gameRand, EntityBuilder.Weapons.scoutShotgun));

  return created;
}

EntityBuilder.createFighter = function (board, manager, gameRand, x, y) {
  var created = EntityBuilder.createBaseShip(board, manager, x, y);

  manager.addComponent(created, Component.Actor.bind(null, 50));

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'fighter');
  manager.addComponent(created, cSprite);

  manager.addComponent(created, Component.FoeAI.bind(null, AI.BaseAI.Create(0)));

  manager.addComponent(created, Component.Fighter.bind(null, 30, 0, 0));

  manager.addComponent(created, Component.EquipSpace);
  created.equipSpace.equip(EntityBuilder.createWeaponEntity(manager, gameRand, EntityBuilder.Weapons.smallGatling));
  created.equipSpace.equip(EntityBuilder.createWeaponEntity(manager, gameRand, EntityBuilder.Weapons.smallGatling));
  created.equipSpace.equip(EntityBuilder.createWeaponEntity(manager, gameRand, EntityBuilder.Weapons.smallGatling));

  return created;
}

EntityBuilder.createPlayer = function (board, manager, gameRand, x, y) {
  var player = manager.createEntity();

  manager.addComponent(player, Component.Player);

  manager.addComponent(player, Component.Actor.bind(null, 100));

  manager.addComponent(player, Component.Position.bind(null, board, x, y));

  var cSprite = Component.PhaserSprite.bind(null, x, y, 'skiff');
  manager.addComponent(player, cSprite);

  manager.addComponent(player, Component.Fighter.bind(null, 15, 0, 1000));

  manager.addComponent(player, Component.EquipSpace);
  var weapon = EntityBuilder.createWeaponEntity(manager, gameRand, EntityBuilder.Weapons.cuttingLaser);
  player.equipSpace.equip(weapon);

  var onPlayerDestroyed = function () { game.state.start('GameOver'); }
  var cd = Component.Destroyable.bind(null, manager,onPlayerDestroyed)
  manager.addComponent(player, cd);

  return player;
}


/******************************************************************************
 *                            OTHER MAP ENTITIES                              *
 ******************************************************************************/
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

EntityBuilder.createLineProjectile = function (board, manager, x0, y0, x1, y1, speed, damage) {
  var projectile = manager.createEntity();

  var cp = Component.Position.bind(null, board, x0, y0, false);
  manager.addComponent(projectile, cp);

  manager.addComponent(projectile, Component.Actor.bind(null, speed, 0));

  var sc = Component.PhaserSprite.bind(null, x0, y0, 'bullet');
  manager.addComponent(projectile, sc);

  // This is ridiculous.
  var path = Pattern.LinePath.Create(x0, y0, x1, y1);
  manager.addComponent(projectile, Component.ProjectileAI.bind(null, path));

  manager.addComponent(projectile, Component.Fighter.bind(null, 1, 0, damage));
  manager.addComponent(projectile, Component.Destroyable.bind(null, manager));

  return projectile;
};
