"use strict";

var EntityBuilder = {}

EntityBuilder.loadImages = function () {
  game.load.image('proj_shotgun', './assets/images/projectiles/shotgun.png');
  game.load.image('proj_gatling', './assets/images/projectiles/gatling.png');
  game.load.image('proj_cannon', './assets/images/projectiles/cannon.png');
  game.load.image('proj_reverser', './assets/images/projectiles/reverser.png');
  game.load.image('proj_railgun', './assets/images/projectiles/railgun.png');

  game.load.image('scout', './assets/images/scout.png');
  game.load.image('fighter', './assets/images/fighter.png');
  game.load.image('gunship', './assets/images/gunship.png');
  game.load.image('frigate', './assets/images/frigate.png');
  game.load.image('destroyer', './assets/images/destroyer.png');
  game.load.image('cruiser', './assets/images/cruiser.png');

  game.load.image('jump_point', './assets/images/jump_point.png');
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
  },

  volleyShotgun: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_shotgun',
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 7,
    numShots: 30
  },

  flak: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_shotgun',
    damage: 1,
    speed: 25,
    cooldown: 0,
    spread: 5,
    numShots: 30
  },

  railgun: {
    path: {
      base: Pattern.LinePath,
      params: {}
    },
    projImage: 'proj_railgun',
    damage: 15,
    speed: 20,
    cooldown: 0,
    spread: 0,
    numShots: 1
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
var ACTIVATION_RADIUS = 12;

EntityBuilder.Ships = {
  Scout: {
    sprite: 'scout',
    speed: 75,
    hp: 10,
    defense: 0,
    power: 2,
    ai: {
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 5,
      weaponGroups: [[{slots: [0], priority: 0, group: 0, cooldown: 0, ttl: 0}]]
    },
    weapons: [EntityBuilder.Weapons.scoutShotgun]
  },

  Fighter: {
    sprite: 'fighter',
    speed: 125,
    hp: 30,
    defense: 0,
    power: 0,
    ai: {
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 0,
      weaponGroups: [[{slots: [0, 1, 2], priority: 0, group: 0, cooldown: 0, ttl: 0}]]
    },
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
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 5,
      moveCooldown: 1,
      weaponGroups: [
        [
          {slots: [1], priority: 0, group: 0, cooldown: 4, ttl: 0},
          {slots: [0], priority: 1, group: 0, cooldown: 0, ttl: 0}
        ]
      ]
    },
    weapons: [
      EntityBuilder.Weapons.gunshipShotgun,
      EntityBuilder.Weapons.smallCannon
    ]
  },

  Frigate: {
    sprite: 'frigate',
    speed: 250,
    hp: 150,
    defense: 10,
    power: 3,
    ai: {
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 0,
      weaponGroups: [
        [
          {slots: [0, 2], priority: 0, group: 0, cooldown: 2, ttl: 0},
          {slots: [1, 2, 3], priority: 1, group: 0, cooldown: 0, ttl: 0}
        ]
      ]
    },
    weapons: [
      EntityBuilder.Weapons.reverser,
      EntityBuilder.Weapons.smallGatling,
      EntityBuilder.Weapons.smallCannon,
      EntityBuilder.Weapons.frigateShotgun
    ]
  },

  Destroyer: {
    sprite: 'destroyer',
    speed: 300,
    hp: 200,
    defense: 15,
    power: 0,
    ai: {
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 0,
      weaponGroups: [
        [
          {slots: [0, 1], priority: 0, group: 0, cooldown: 4, ttl: 0},
          {slots: [2], priority: 1, group: 0, cooldown: 0, ttl: 0}
        ]
      ]
    },
    weapons: [
      EntityBuilder.Weapons.volleyShotgun,
      EntityBuilder.Weapons.smallCannon,
      EntityBuilder.Weapons.scoutShotgun
    ]
  },

  Cruiser: {
    sprite: 'cruiser',
    speed: 400,
    hp: 300,
    defense: 10,
    power: 0,
    ai: {
      activationRadius: ACTIVATION_RADIUS,
      stopApproachDistance: 7,
      weaponGroups: [
        [{slots: [0], priority: 0, group: 0, cooldown: 9, ttl: 0, range: 4}],
        [{slots: [1], priority: 0, group: 0, cooldown: 2, ttl: 0}]
      ]
    },
    weapons: [
      EntityBuilder.Weapons.flak,
      EntityBuilder.Weapons.railgun
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

EntityBuilder.createNoPositionShipEntity = function (board, manager, gameRand, params) {
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
  manager.addComponent(created, Component.PhaserSprite.bind(null, -1, -1, params.sprite));
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

EntityBuilder.createShipEntity = function (board, manager, gameRand, x, y, params) {
  var created = EntityBuilder.createNoPositionShipEntity(board, manager, gameRand, params);

  manager.addComponent(created, Component.Position.bind(null, board, x, y));

  return created;
}


/******************************************************************************
 *                            OTHER MAP ENTITIES                              *
 ******************************************************************************/
EntityBuilder.createJumpPoint = function (board, manager, x, y) {
  var created = manager.createEntity();

  manager.addComponent(created, Component.Position.bind(null, board, x, y, false));
  manager.addComponent(created, Component.PhaserSprite.bind(null, x, y, 'jump_point', false));
  manager.addComponent(created, Component.JumpPoint);

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

EntityBuilder.createProjectile = function (board, manager, weapon, x1, y1) {
  var equipper = weapon.owner.equipment.getEquipper();
  var damage = weapon.damage + ((!!equipper.fighter) ? equipper.fighter.power : 0);
  // Should upgrade me browser
  var coordinates = equipper.position.getCurrentPosition();
  var x0 = coordinates[0];
  var y0 = coordinates[1];

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
