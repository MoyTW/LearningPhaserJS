"use strict";

var EntityBuilder = {}

EntityBuilder.loadImages = function () {
  game.load.image('proj_shotgun', './assets/images/projectiles/shotgun.png');
  game.load.image('proj_gatling', './assets/images/projectiles/gatling.png');
  game.load.image('proj_cannon', './assets/images/projectiles/cannon.png');
  game.load.image('proj_reverser', './assets/images/projectiles/reverser.png');

  game.load.image('scout', './assets/images/scout.png');
  game.load.image('fighter', './assets/images/fighter.png');
  game.load.image('gunship', './assets/images/gunship.png');
  game.load.image('frigate', './assets/images/frigate.png');
}

/******************************************************************************
 *                                  WEAPONS                                   *
 ******************************************************************************/
EntityBuilder.Weapons = {

  cuttingLaser: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    damage: 0,
    speed: 0,
    cooldown: 0,
    spread: 0,
    numShots: 1
  },

  scoutShotgun: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_shotgun',
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 2,
    numShots: 3
  },

  smallGatling: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_gatling',
    damage: 2,
    speed: 50,
    cooldown: 0,
    spread: 0,
    numShots: 1
  },

  gunshipShotgun: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_shotgun',
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 2,
    numShots: 3
  },

  smallCannon: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_cannon',
    damage: 5,
    speed: 50,
    cooldown: 0,
    spread: 0,
    numShots: 1
  },

  reverser: {
    path: {
      base: Pattern.ReverserPath,
      params: {
        overshoot: 4
      }
    },
    projImage: 'proj_reverser',
    damage: 2,
    speed: 33,
    cooldown: 0,
    spread: 0,
    numShots: 1
  },

  frigateShotgun: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_shotgun',
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 3,
    numShots: 2
  }

}

EntityBuilder.createWeaponEntity = function (manager, gameRand, blueprint) {
  var e = manager.createEntity();

  manager.addComponent(e, Component.Equipment);
  manager.addComponent(e, Component.Weapon.bind(null, gameRand, blueprint));

  return e;
}


/******************************************************************************
 *                                   SHIPS                                    *
 ******************************************************************************/
EntityBuilder.Ships = {
  Scout: {
    driver: Component.FoeAI.bind(null, AI.BaseAI.Create(5)),
    sprite: 'scout',
    speed: 75,
    hp: 10,
    defense: 0,
    power: 2,
    weapons: [EntityBuilder.Weapons.reverser]
  },

  Fighter: {
    driver: Component.FoeAI.bind(null, AI.BaseAI.Create(0)),
    sprite: 'fighter',
    speed: 125,
    hp: 30,
    defense: 0,
    power: 0,
    weapons: [
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallGatling
    ]
  },

  Gunship: {
    sprite: 'gunship',
    speed: 100,
    hp: 50,
    defense: 4,
    power: 3,
    ai: {
      stopApproachDistance: 5,
      moveCooldown: 1,
      weaponGroups: [
        [
          {slot: 1, priority: 0, group: 0, cooldown: 4, ttl: 0},
          {slot: 0, priority: 1, group: 0, cooldown: 0, ttl: 0}
        ]
      ]
    },
    weapons: [
      EntityBuilder.Weapons.gunshipShotgun,
      EntityBuilder.Weapons.smallCannon
    ]
  },

  Frigate: {
    driver: Component.FoeAI.bind(null, AI.BaseAI.Create(0)),
    sprite: 'frigate',
    speed: 250,
    defense: 10,
    power: 3,
    weapons: [
      EntityBuilder.Weapons.reverser,
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallCannon,
      EntityBuilder.Weapons.frigateShotgun
    ]
  },

  PlayerSkiff: {
    player: true,
    sprite: 'skiff',
    speed: 100,
    hp: 15,
    defense: 0,
    power: 1,
    weapons: [EntityBuilder.Weapons.cuttingLaser],
    onDestroyedCallback: function () { game.state.start('GameOver'); }
  }
}

EntityBuilder.createShipEntity = function (board, manager, gameRand, x, y, params) {
  var created = manager.createEntity();

  // I'm not super fond of having 'driver' be a Constructor function, as opposed
  // to being just data, since if I put this data into files I'll need to
  // revisit this. However, that is not in my minimal implementation plan.

  if (params.player) {
    manager.addComponent(created, Component.Player);
  } else if (!!params.ai) {
    manager.addComponent(created, Component.FoeAI.bind(null, AI.ParameterizedAI.Create(params.ai)));
  } else if (!!params.driver) {
    manager.addComponent(created, params.driver);
  }

  manager.addComponent(created, Component.Actor.bind(null, params.speed));
  manager.addComponent(created, Component.Position.bind(null, board, x, y));
  manager.addComponent(created, Component.PhaserSprite.bind(null, x, y, params.sprite));
  manager.addComponent(created, Component.Fighter.bind(null, params.hp, params.defense, params.power));
  manager.addComponent(created, Component.EquipSpace);
  manager.addComponent(created, Component.Destroyable.bind(null, manager, params.onDestroyedCallback));
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

EntityBuilder.createProjectile = function (board, manager, weapon, x1, y1) {
  var equipper = weapon.owner.equipment.getEquipper();
  var damage = weapon.damage + (!!equipper.fighter) ? equipper.fighter.power : 0;
  var x0 = equipper.position.x;
  var y0 = equipper.position.y;

  var projectile = manager.createEntity();

  var cp = Component.Position.bind(null, board, x0, y0, false);
  manager.addComponent(projectile, cp);

  manager.addComponent(projectile, Component.Actor.bind(null, weapon.projSpeed, 0));

  if (!!weapon.projImage) {
    var sc = Component.PhaserSprite.bind(null, x0, y0, weapon.projImage);
    manager.addComponent(projectile, sc);
  }

  // This is ridiculous.
  var path = weapon.path.base.Create(x0, y0, x1, y1, weapon.path.params);
  manager.addComponent(projectile, Component.ProjectileAI.bind(null, path));

  manager.addComponent(projectile, Component.Fighter.bind(null, 1, 0, damage));
  manager.addComponent(projectile, Component.Destroyable.bind(null, manager));

  return projectile;
};
