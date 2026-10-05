class EscenaMemoramaTierra extends Phaser.Scene {
    constructor() { super({ key: 'EscenaMemoramaTierra' }); }
    create() {
        this._transitando = false;
        this.cameras.main.setBackgroundColor('#0a1433');
        const g = this.add.graphics();
        g.fillStyle(0x0d1f4a, 1);
        g.fillRect(0, 0, 1000, 800);
        this.add.text(500, 300, 'MEMORAMA\nLA TIERRA', {
            fontSize: '38px', fontFamily: '"Press Start 2P", monospace',
            fill: '#5da8ff', align: 'center', stroke: '#0a1e50', strokeThickness: 4
        }).setOrigin(0.5);
        this.add.text(500, 460, 'Proximamente...', {
            fontSize: '20px', fontFamily: '"Press Start 2P", monospace', fill: '#e8f0ff'
        }).setOrigin(0.5);
        this._botonVolver();
        this.cameras.main.fadeIn(400, 0, 0, 0);
    }
    _botonVolver() {
        const btn = this.add.text(500, 580, '< VOLVER A SALA A', {
            fontSize: '13px', fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff', backgroundColor: '#0a1e50', padding: { x: 18, y: 12 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setStyle({ fill: '#f1c40f' }));
        btn.on('pointerout', () => btn.setStyle({ fill: '#ffffff' }));
        const ir = () => {
            if (this._transitando) return;
            this._transitando = true;
            this.cameras.main.fadeOut(300, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('EscenaSalaAMenu'));
        };
        btn.on('pointerdown', ir);
        this.input.keyboard.on('keydown-ESC', ir);
    }
}
