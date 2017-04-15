"use strict";

var skiffSprite;
var manager = new ECS.EntityManager();

var Game = {

  preload : function() {
    game.load.image('skiff', './assets/images/skiff.png');
  },

  create: function () {
    menu.width = 650;
    menu.height = 400;
    skiffSprite = manager.createEntity();
    // Honestly, this is a little silly, isn't it? I mean, I know partials are
    // second-nature for lispy folks but javascript's this is apparently a pit
    // of vipers.
    var SpriteComponent = Game.SpriteComponent.bind(null, 0, 0, 'skiff');
    manager.addComponent(skiffSprite, SpriteComponent);
  },

  // Name duplication here is silly!
  SpriteComponent : function SpriteComponent (x, y, spriteName) {
    this.sprite = game.add.sprite(x, y, spriteName);
  },

  update: function () {
    var cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      skiffSprite.spriteComponent.sprite.y -= 5;
    }
    else if (cursors.right.isDown)
    {
      skiffSprite.spriteComponent.sprite.x += 5;
    }
    else if (cursors.down.isDown)
    {
      skiffSprite.spriteComponent.sprite.y += 5;
    }
    else if (cursors.left.isDown)
    {
      skiffSprite.spriteComponent.sprite.x -= 5;
    }
  },

};
