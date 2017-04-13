var game;

// Scale to user port?
game = new Phaser.Game(600, 450, Phaser.AUTO, '');

// States
game.state.add('Menu', Menu);
game.state.add('Game', Game);

game.state.start('Menu');
