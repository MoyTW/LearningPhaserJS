"use strict";

var skiffEntity;
var board;
var manager = new ECS.EntityManager();

var Game = {

  preload : function() {
    game.load.image('white_square', './assets/images/white_square.png');
    game.load.image('skiff', './assets/images/skiff.png');
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

    skiffEntity = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    manager.addComponent(skiffEntity, Component.Position.bind(null, board, 5, 5));
    var SpriteComponent = Component.PhaserSprite.bind(null,
                                                      skiffEntity.position.x,
                                                      skiffEntity.position.y,
                                                      'skiff');
    manager.addComponent(skiffEntity, SpriteComponent);
  },

  update: function () {
    var cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      skiffEntity.position.step(0, -1);
    }
    else if (cursors.right.isDown)
    {
      skiffEntity.position.step(1, 0);
    }
    else if (cursors.down.isDown)
    {
      skiffEntity.position.step(0, 1);
    }
    else if (cursors.left.isDown)
    {
      skiffEntity.position.step(-1, 0);
    }
  },

};
