class EscenaMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaMenu' });
    }

    preload() {
        this.load.image('arbusto', 'pictures/arbusto.png');
        this.load.spritesheet('dinobit-menu', 'pictures/dinobit.png', {
            frameWidth: 75,
            frameHeight: 74
        });

        this.avatarOpciones = ['user_default', 'user_male', 'user_female'];
        this.avatarOpciones.forEach((avatarKey) => {
            this.load.spritesheet(`avatar-${avatarKey}`, `pictures/${avatarKey}.png`, {
                frameWidth: 64,
                frameHeight: 64
            });
        });
    }

    create() {
        this.avatarSeleccionado = localStorage.getItem('muchbits-avatar') || 'user_default';
        this.cameras.main.setBackgroundColor('#1a1a2e');

        for (let x = 45; x <= 945; x += 90) {
            this.add.image(x, 30, 'arbusto')
                .setDisplaySize(130, 130)
                .setDepth(-1);
            this.add.image(x, 770, 'arbusto')
                .setDisplaySize(130, 130)
                .setDepth(-1);
        }

        for (let y = 120; y <= 680; y += 95) {
            this.add.image(30, y, 'arbusto')
                .setDisplaySize(130, 130)
                .setDepth(-1);
            this.add.image(970, y, 'arbusto')
                .setDisplaySize(130, 130)
                .setDepth(-1);
        }

        if (!this.anims.exists('dino-menu-derecha')) {
            this.anims.create({
                key: 'dino-menu-derecha',
                frames: this.anims.generateFrameNumbers('dinobit-menu', { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
        }

        if (!this.anims.exists('dino-menu-izquierda')) {
            this.anims.create({
                key: 'dino-menu-izquierda',
                frames: this.anims.generateFrameNumbers('dinobit-menu', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }

        this.dinoMenu = this.add.sprite(-80, 710, 'dinobit-menu')
            .setDisplaySize(80, 78)
            .setDepth(1);
        this.dinoVaHaciaLaDerecha = true;
        this.moverDinoMenu();

        this.add.text(500, 170, 'MuchBits', {
            fontSize: '64px',
            fill: '#e74c3c',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.add.text(500, 230, 'Elige tu avatar', {
            fontSize: '26px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        this.avatarBordes = [];
        const avatarY = 360;
        this.avatarOpciones.forEach((avatarKey, index) => {
            const avatarX = 330 + index * 170;
            const avatarImage = this.add.sprite(avatarX, avatarY, `avatar-${avatarKey}`, 0)
                .setDisplaySize(90, 90)
                .setInteractive({ useHandCursor: true })
                .setDepth(2);

            const borde = this.add.graphics();
            borde.lineStyle(6, avatarKey === this.avatarSeleccionado ? 0xf1c40f : 0x2c3e50, 1);
            borde.strokeRoundedRect(avatarX - 60, avatarY - 60, 120, 120, 18);
            borde.setDepth(3);
            this.avatarBordes.push({ key: avatarKey, borde });

            const etiqueta = this.add.text(avatarX, avatarY + 78, avatarKey.replace('user_', '').toUpperCase(), {
                fontSize: '16px',
                fill: '#ffffff',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            etiqueta.setDepth(3);

            avatarImage.on('pointerdown', () => this.seleccionarAvatar(avatarKey));
        });

        let botonIniciar = this.add.text(500, 560, 'INICIAR JUEGO', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let textoCreditos = this.add.text(500, 700, 'Créditos: Departamento SATA y colaboradores', {
            fontSize: '20px',
            fill: '#7f8c8d',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setVisible(false);

        let botonCreditos = this.add.text(500, 630, 'VER CRÉDITOS', {
            fontSize: '24px',
            fill: '#3498db',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonIniciar.on('pointerover', () => botonIniciar.setStyle({ fill: '#f1c40f' }));
        botonIniciar.on('pointerout', () => botonIniciar.setStyle({ fill: '#ffffff' }));

        botonIniciar.on('pointerdown', () => {
            localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
            this.scene.start('EscenaJuego', { avatarKey: this.avatarSeleccionado });
        });

        botonCreditos.on('pointerdown', () => {
            textoCreditos.setVisible(!textoCreditos.visible);
        });
    }

    seleccionarAvatar(avatarKey) {
        this.avatarSeleccionado = avatarKey;
        localStorage.setItem('muchbits-avatar', avatarKey);

        this.avatarBordes.forEach(({ key, borde }) => {
            borde.clear();
            borde.lineStyle(6, key === avatarKey ? 0xf1c40f : 0x2c3e50, 1);
            borde.strokeRoundedRect(this.avatarOpciones.indexOf(key) * 170 + 270, 300, 120, 120, 18);
        });
    }

    moverDinoMenu() {
        let vaHaciaLaDerecha = this.dinoVaHaciaLaDerecha;
        this.dinoMenu
            .setFlipX(vaHaciaLaDerecha)
            .play(vaHaciaLaDerecha ? 'dino-menu-derecha' : 'dino-menu-derecha');

        this.tweens.add({
            targets: this.dinoMenu,
            x: vaHaciaLaDerecha ? 1050 : -50,
            duration: 7000,
            ease: 'Linear',
            onComplete: () => {
                this.dinoVaHaciaLaDerecha = !this.dinoVaHaciaLaDerecha;
                this.moverDinoMenu();
            }
        });
    }
}
