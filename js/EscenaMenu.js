class EscenaMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaMenu' });
    }

    preload() {
        this.load.image('arbusto', 'pictures/arbusto.png');
        this.load.spritesheet('dinobit-menu', 'pictures/dinosaur-run.png', {
            frameWidth: 396,
            frameHeight: 396
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
                .setDisplaySize(65, 65)
                .setDepth(-1);
            this.add.image(x, 770, 'arbusto')
                .setDisplaySize(65, 65)
                .setDepth(-1);
        }

        for (let y = 120; y <= 680; y += 95) {
            this.add.image(30, y, 'arbusto')
                .setDisplaySize(65, 65)
                .setDepth(-1);
            this.add.image(970, y, 'arbusto')
                .setDisplaySize(65, 65)
                .setDepth(-1);
        }

        if (!this.anims.exists('dino-menu-corriendo')) {
            this.anims.create({
                key: 'dino-menu-corriendo',
                frames: this.anims.generateFrameNumbers('dinobit-menu', { start: 0, end: 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        if (!this.anims.exists('dino-menu-derecha')) {
            this.anims.create({
                key: 'dino-menu-derecha',
                frames: this.anims.generateFrameNumbers('dinobit-menu', { start: 0, end: 12 }),
                frameRate: 12,
                repeat: -1
            });
        }

        this.dinoMenu = this.add.sprite(-80, 710, 'dinobit-menu')
            .setDisplaySize(140, 140)
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

        let botonIniciar = this.add.text(500, 545, 'INICIAR JUEGO', {
            fontSize: '30px',
            fill: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            backgroundColor: '#27ae60',
            padding: { x: 20, y: 8 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        let botonSalaEnergia = this.add.text(500, 605, '⚡ JUGAR SALA ENERGÍA (PRESA)', {
            fontSize: '17px',
            fill: '#00f2fe',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            backgroundColor: '#0a3d62',
            padding: { x: 16, y: 7 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonSalaEnergia.on('pointerover', () => botonSalaEnergia.setStyle({ fill: '#ffffff', backgroundColor: '#0984e3' }));
        botonSalaEnergia.on('pointerout', () => botonSalaEnergia.setStyle({ fill: '#00f2fe', backgroundColor: '#0a3d62' }));
        botonSalaEnergia.on('pointerdown', () => {
            localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
            this.scene.start('EscenaEnergia', { avatarKey: this.avatarSeleccionado });
        });

        let textoCreditos = this.add.text(500, 740, 'Departamento SATA y Colaboradores: \nGabriel Reyes, Leonardo Ruiz, Fatima Bustamante', {
            fontSize: '18px',
            fill: '#FFFFFF',
            fontFamily: 'Arial',
            backgroundColor: '#2c3e50',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setDepth(3).setVisible(false);

        let botonCreditos = this.add.text(500, 655, 'VER CRÉDITOS', {
            fontSize: '18px',
            fill: '#3498db',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        botonIniciar.on('pointerover', () => botonIniciar.setStyle({ fill: '#f1c40f' }));
        botonIniciar.on('pointerout', () => botonIniciar.setStyle({ fill: '#ffffff' }));

        const accionIniciar = () => {
            localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
            this.scene.start('EscenaJuego', { avatarKey: this.avatarSeleccionado });
        };

        const accionCreditos = () => {
            textoCreditos.setVisible(!textoCreditos.visible);
        };

        botonIniciar.on('pointerdown', accionIniciar);
        botonCreditos.on('pointerdown', accionCreditos);

        this.input.keyboard.on('keydown-ENTER', accionIniciar);
        this.input.keyboard.on('keydown-SPACE', accionIniciar);
        this.input.keyboard.on('keydown-ESC', accionCreditos);
    }

    update() {
        if (window.mobileControls?.consume('enter')) {
            localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
            this.scene.start('EscenaJuego', { avatarKey: this.avatarSeleccionado });
        }
        if (window.mobileControls?.consume('escape')) {
            const textoCreditos = this.children.getChildren().find(c => c.text && c.text.includes('Departamento SATA'));
            if (textoCreditos) textoCreditos.setVisible(!textoCreditos.visible);
        }
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
            .play('dino-menu-corriendo', true);

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
