"use strict";

var board;
var manager = new ECS.EntityManager();

var Game = {

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
    game.load.image('dreadnought', './assets/images/dreadnought.png');
  },

  create: function () {
    menu.width = 650;
    menu.height = 400;

    board = new Level.Board(15, 15);
    // Phaser has a concept of tilesets, which we will want to use eventually!
    for (var x = 0; x < board.width; x++) {
      for (var y = 0; y < board.height; y++) {
        if (!board.isPassable(x, y)) {
          var sprite = game.add.sprite(x, y, 'white_square');
          sprite.x = x * 30;
          sprite.y = y * 30;
        }
      }
    }

    var skiffEntity = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    manager.addComponent(skiffEntity, Component.Player);
    manager.addComponent(skiffEntity, Component.Position.bind(null, board, 5, 5));
    var SpriteComponent = Component.PhaserSprite.bind(null,
                                                      skiffEntity.position.x,
                                                      skiffEntity.position.y,
                                                      'skiff');
    manager.addComponent(skiffEntity, SpriteComponent);

    var dreadnought = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    manager.addComponent(dreadnought, Component.Position.bind(null, board, 10, 10));
    SpriteComponent = Component.PhaserSprite.bind(null,
                                                  dreadnought.position.x,
                                                  dreadnought.position.y,
                                                  'dreadnought');
    manager.addComponent(dreadnought, SpriteComponent);
    manager.addComponent(dreadnought, Component.FoeAI.bind(null, board, dreadnought.position));
  },

  update: function () {
    var cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      var player = manager.findPlayer();
      player.position.step(0, -1);
      var foes = manager.findByComponent(Component.FoeAI);
      foes.forEach(function(entity) { entity.foeAI.pathTowards(player.position.x, player.position.y); })
    }
    else if (cursors.right.isDown)
    {
      var player = manager.findPlayer();
      player.position.step(1, 0);
      var foes = manager.findByComponent(Component.FoeAI);
      foes.forEach(function(entity) { entity.foeAI.pathTowards(player.position.x, player.position.y); })
    }
    else if (cursors.down.isDown)
    {
      var player = manager.findPlayer();
      player.position.step(0, 1);
      var foes = manager.findByComponent(Component.FoeAI);
      foes.forEach(function(entity) { entity.foeAI.pathTowards(player.position.x, player.position.y); })
    }
    else if (cursors.left.isDown)
    {
      var player = manager.findPlayer();
      player.position.step(-1, 0);
      var foes = manager.findByComponent(Component.FoeAI);
      foes.forEach(function(entity) { entity.foeAI.pathTowards(player.position.x, player.position.y); })
    }
  },

};
