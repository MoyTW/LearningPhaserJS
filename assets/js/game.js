var skiffSprite;

var Game = {

  preload : function() {
    game.load.image('skiff', './assets/images/skiff.png');
  },

  create: function () {
    skiffSprite = this.add.sprite(0, 0, 'skiff');
    menu.width = 650;
    menu.height = 400;
  },

  update: function() {
    cursors = game.input.keyboard.createCursorKeys();

    if (cursors.up.isDown)
    {
      skiffSprite.y -= 5;
    }
    else if (cursors.right.isDown)
    {
      skiffSprite.x += 5;
    }
    else if (cursors.down.isDown)
    {
      skiffSprite.y += 5;
    }
    else if (cursors.left.isDown)
    {
      skiffSprite.x -= 5;
    }
  },

};
