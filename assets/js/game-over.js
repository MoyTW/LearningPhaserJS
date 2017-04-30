"use strict";

var GameOver = {

  preload : function () { },

  create : function () {
    var textParams = {boundsAlignH: "center",
                      boundsAlignV: "middle",
                      fontSize: '64px',
                      fill: '#FFF' };
    var text = game.add.text(0, 0, 'RIP You', textParams);
    text.fixedToCamera = true;
    text.cameraOffset.setTo(game.width / 2 - text.width / 2,
                            game.height / 2 - text.height / 2);

    this.spaceKey = this.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    this.enterKey = this.input.keyboard.addKey(Phaser.Keyboard.ENTER);

  },

  endGame : function () {
    this.state.start('Menu');
  },

  update : function () {
    if (this.spaceKey.isDown || this.enterKey.isDown) {
      this.endGame();
    }
  }

};
