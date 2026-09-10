const config = {
    type: Phaser.CANVAS,
    width: 1000,
    height: 800,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    },
    scene: [EscenaMenu, EscenaJuego, EscenaDinoRun]
};

const game = new Phaser.Game(config);
