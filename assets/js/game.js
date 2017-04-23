"use strict";

var Game = {

  board : null,
  manager : null,

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
    game.load.image('bullet', './assets/images/bullet.png');
  },

  create: function () {
    this.manager = ECS.EntityManager.Create();

    this.board = new Level.Board(this.manager, 15, 15);
    // Phaser has a concept of tilesets, which we will want to use eventually!
    for (var x = 0; x < this.board.width; x++) {
      for (var y = 0; y < this.board.height; y++) {
        if (!this.board.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'white_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

    var tagFn = this.manager.replaceTagFn();

    var skiffEntity = this.manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    this.manager.addComponent(skiffEntity, Component.Player);
    this.manager.addComponent(skiffEntity, Component.Actor.bind(null, 100));
    var cp = Component.Position.bind(null, this.board, 5, 5, tagFn);
    this.manager.addComponent(skiffEntity, cp);
    var SpriteComponent = Component.PhaserSprite.bind(null,
                                                      skiffEntity.position.x,
                                                      skiffEntity.position.y,
                                                      'skiff');
    this.manager.addComponent(skiffEntity, SpriteComponent);
    this.manager.addComponent(skiffEntity,
                              Component.Fighter.bind(null, 15, 0, 5));
    var onPlayerDestroyed = function () { game.state.start('GameOver'); }
    var cd = Component.Destroyable.bind(null, this.manager,onPlayerDestroyed)
    this.manager.addComponent(skiffEntity, cd);

    var dreadnought = this.manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    cp = Component.Position.bind(null, this.board, 10, 10, tagFn);
    this.manager.addComponent(dreadnought, cp);
    this.manager.addComponent(dreadnought, Component.Actor.bind(null, 200));
    SpriteComponent = Component.PhaserSprite.bind(null,
                                                  dreadnought.position.x,
                                                  dreadnought.position.y,
                                                  'dreadnought');
    this.manager.addComponent(dreadnought, SpriteComponent);
    this.manager.addComponent(dreadnought, Component.FoeAI);
    this.manager.addComponent(dreadnought,
                              Component.Fighter.bind(null, 10, 0, 2));
    this.manager.addComponent(dreadnought,
                              Component.Destroyable.bind(null, this.manager));
  },

  takeInput : function() {
    // You don't need to re-create these objects every time, actually! See: Menu
    // input code.
    var cursors = game.input.keyboard.createCursorKeys();
    var player = this.manager.findPlayer();

    if (cursors.up.isDown) {
      player.position.step(0, -1);
      return true;
    } else if (cursors.right.isDown) {
      player.position.step(1, 0);
      return true;
    } else if (cursors.down.isDown) {
      player.position.step(0, 1);
      return true;
    } else if (cursors.left.isDown) {
      player.position.step(-1, 0);
      return true;
    } else {
      return false;
    }
  },

  update: function () {
    Game.runTurn(this.board, this.manager);
  },

  runTurn : function(board, manager) {
    // Find next active Actor
    var actors = manager.findByComponent(Component.Actor);
    var minTTL = 9999;
    var nextActor = null;
    var minActor = null;
    for (var i = 0; i < actors.length; i++) {
      if (actors[i].actor.ttl == 0) {
        nextActor = actors[i];
        break;
      } else if (actors[i].actor.ttl < minTTL) {
        minTTL = actors[i].actor.ttl;
        minActor = actors[i];
      }
    }

    // If no active Actors, fast forward
    if (nextActor == null) {
      nextActor = minActor;
      for (var i = 0; i < actors.length; i++) {
        actors[i].actor.passTime(minTTL);
      }
    }

    // Run your action(s) and end turn
    if (nextActor == manager.findPlayer()) {
      if (Game.takeInput()) {
        nextActor.actor.endTurn();
      }
    } else if (nextActor.hasComponent(Component.FoeAI)) {
      nextActor.foeAI.takeTurn(board, manager);
      nextActor.actor.endTurn();
    } else if (nextActor.hasComponent(Component.ProjectileAI)) {
      nextActor.projectileAI.takeTurn(manager);
      nextActor.actor.endTurn();
    }
  }

};
