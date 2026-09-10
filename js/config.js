const config = {
    type: Phaser.CANVAS,
    width: 1000,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [EscenaMenu, EscenaJuego, EscenaDinoRun]
};

const game = new Phaser.Game(config);
