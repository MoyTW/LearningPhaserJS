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
EntityBuilder.Ships = {
  Scout : {
    driver : Component.FoeAI.bind(null, AI.BaseAI.Create(5)),
    sprite : 'scout',
    speed : 75,
    hp : 10,
    defense : 0,
    power : 2,
    weapons : [EntityBuilder.Weapons.scoutShotgun]
  },

  Fighter : {
    driver : Component.FoeAI.bind(null, AI.BaseAI.Create(0)),
    sprite : 'fighter',
    speed: 125,
    hp : 30,
    defense : 0,
    power : 0,
    weapons : [
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallGatling
    ]
  },

  PlayerSkiff : {
    driver : Component.Player,
    sprite : 'skiff',
    speed: 100,
    hp: 15,
    defense: 0,
    power : 1,
    weapons : [EntityBuilder.Weapons.cuttingLaser],
    onDestroyedCallback : function () { game.state.start('GameOver'); }
  }
}

EntityBuilder.createShipEntity = function (board, manager, gameRand, x, y, params) {
  var created = manager.createEntity();

  // I'm not super fond of having 'driver' be a Constructor function, as opposed
  // to being just data, since if I put this data into files I'll need to
  // revisit this. However, that is not in my minimal implementation plan.
  manager.addComponent(created, params.driver);
  manager.addComponent(created, Component.Actor.bind(null, params.speed));
  manager.addComponent(created, Component.Position.bind(null, board, x, y));
  manager.addComponent(created, Component.PhaserSprite.bind(null, x, y, params.sprite));
  manager.addComponent(created, Component.Fighter.bind(null, params.hp, params.defense, params.power));
  manager.addComponent(created, Component.EquipSpace);
  manager.addComponent(created, Component.Destroyable.bind(null, manager));
  if (!!params.weapons) {
    for (var weapon of params.weapons) {
      created.equipSpace.equip(EntityBuilder.createWeaponEntity(manager, gameRand, weapon));
    }
  }

  return created;
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
