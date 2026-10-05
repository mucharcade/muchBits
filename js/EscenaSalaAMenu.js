class EscenaSalaAMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSalaAMenu' });
    }

    preload() {
        this.load.image('wood-sign', 'pictures/wood.png');
        this.load.image('arbusto', 'pictures/arbusto.png');
    }

    create() {
        this._transitando = false;
        this.cameras.main.setBackgroundColor('#2d5a27');

        this._dibujarFondo();
        this._crearTitulo();
        this._crearTarjetas();
        this._crearBotonRegreso();
        this._animarEntrada();
    }

    _dibujarFondo() {
        const g = this.add.graphics();

        // Fondo base verde oscuro
        g.fillStyle(0x1e3d1a, 1);
        g.fillRect(0, 0, 1000, 800);

        // Tablas de piso horizontal
        const coloresTabla = [0x4a7c3f, 0x3d6b34, 0x527a3e, 0x3a6430];
        const alturaTabla = 40;
        for (let y = 0; y < 800; y += alturaTabla) {
            const color = coloresTabla[Math.floor(y / alturaTabla) % coloresTabla.length];
            g.fillStyle(color, 1);
            g.fillRect(0, y, 1000, alturaTabla - 2);
        }

        // Marco de madera
        g.lineStyle(18, 0x3b1e08, 1);
        g.strokeRect(9, 9, 982, 782);
        g.lineStyle(6, 0x8b5e2e, 1);
        g.strokeRect(20, 20, 960, 760);

        // Tornillos en esquinas
        const esquinas = [[40, 40], [960, 40], [40, 760], [960, 760]];
        esquinas.forEach(([x, y]) => {
            g.fillStyle(0x5a2d0c, 1);
            g.fillRect(x - 12, y - 12, 24, 24);
            g.fillStyle(0xd4a84b, 1);
            g.fillRect(x - 6, y - 6, 12, 12);
        });

        // Arbustos decorativos
        for (let x = 70; x <= 930; x += 80) {
            this.add.image(x, 28, 'arbusto').setDisplaySize(50, 50).setAlpha(0.7).setDepth(0);
            this.add.image(x, 772, 'arbusto').setDisplaySize(50, 50).setAlpha(0.7).setDepth(0);
        }
    }

    _crearTitulo() {
        const letreroX = 500;
        const letreroY = 130;

        const letrero = this.add.image(letreroX, letreroY, 'wood-sign')
            .setDisplaySize(480, 180)
            .setDepth(2);

        // Balanceo suave
        this.tweens.add({
            targets: letrero,
            angle: { from: -1.5, to: 1.5 },
            duration: 3000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });

        this.add.text(letreroX, letreroY - 10, 'SALA  A', {
            fontSize: '34px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#3b1e08',
            stroke: '#c8832a',
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#7a4010', blur: 0, fill: true }
        }).setOrigin(0.5).setDepth(3);

        this.add.text(letreroX, letreroY + 40, 'Elige tu Memorama', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#5a2d0c',
            stroke: '#f0d080',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(3);
    }

    _crearTarjetas() {
        this.containersTarjetas = [];

        const opciones = [
            {
                id: 'animales',
                emoji: '🦁',
                titulo: 'ANIMALES',
                descripcion: 'Descubre\nlas cartas\nde animales',
                colorFondo: 0xd97b2e,
                colorBorde: 0xff9f4a,
                colorTexto: '#fff8e7',
                colorSombra: '#7a3800',
                escena: 'EscenaMemoramaAnimales'
            },
            {
                id: 'plantas',
                emoji: '🌿',
                titulo: 'PLANTAS',
                descripcion: 'Descubre\nlas cartas\nde plantas',
                colorFondo: 0x2e8b3e,
                colorBorde: 0x5ecf70,
                colorTexto: '#eaffea',
                colorSombra: '#0a4010',
                escena: 'EscenaMemoramaPlantas'
            },
            {
                id: 'tierra',
                emoji: '🌍',
                titulo: 'LA TIERRA',
                descripcion: 'Descubre\nlas cartas\nde la Tierra',
                colorFondo: 0x2e5fa3,
                colorBorde: 0x5da8ff,
                colorTexto: '#e8f0ff',
                colorSombra: '#0a1e50',
                escena: 'EscenaMemoramaTierra'
            }
        ];

        const xInicial = 175;
        const separacion = 275;
        const yTarjeta = 460;
        const anchoTarjeta = 220;
        const altoTarjeta = 330;

        opciones.forEach((opcion, i) => {
            const x = xInicial + i * separacion;

            // Sombra flotante
            const sombra = this.add.graphics().setDepth(4);
            sombra.fillStyle(0x000000, 0.35);
            sombra.fillRoundedRect(x - anchoTarjeta / 2 + 8, yTarjeta - altoTarjeta / 2 + 8, anchoTarjeta, altoTarjeta, 22);

            // Container interactivo
            const container = this.add.container(x, yTarjeta).setDepth(5);
            container.setSize(anchoTarjeta, altoTarjeta);
            container.setInteractive({ useHandCursor: true });

            // Imagen de madera con tinte de color
            const cardWood = this.add.image(0, 0, 'wood-sign')
                .setDisplaySize(anchoTarjeta, altoTarjeta)
                .setTint(opcion.colorFondo)
                .setAlpha(0.93);

            // Borde
            const borde = this.add.graphics();
            borde.lineStyle(5, opcion.colorBorde, 1);
            borde.strokeRoundedRect(-anchoTarjeta / 2, -altoTarjeta / 2, anchoTarjeta, altoTarjeta, 22);

            // Emoji
            const emoji = this.add.text(0, -90, opcion.emoji, {
                fontSize: '68px'
            }).setOrigin(0.5);

            // Título
            const titulo = this.add.text(0, 8, opcion.titulo, {
                fontSize: '15px',
                fontFamily: '"Press Start 2P", monospace',
                fill: opcion.colorTexto,
                stroke: opcion.colorSombra,
                strokeThickness: 3,
                align: 'center'
            }).setOrigin(0.5);

            // Descripción
            const desc = this.add.text(0, 75, opcion.descripcion, {
                fontSize: '12px',
                fontFamily: 'Arial',
                fill: opcion.colorTexto,
                align: 'center',
                lineSpacing: 5
            }).setOrigin(0.5);

            // Botón JUGAR
            const btnBg = this.add.graphics();
            btnBg.fillStyle(opcion.colorBorde, 1);
            btnBg.fillRoundedRect(-55, 118, 110, 38, 10);

            const btnTexto = this.add.text(0, 137, '▶ JUGAR', {
                fontSize: '12px',
                fontFamily: '"Press Start 2P", monospace',
                fill: '#1a0a00'
            }).setOrigin(0.5);

            container.add([cardWood, borde, emoji, titulo, desc, btnBg, btnTexto]);

            // ── Hover ──────────────────────────────────────────────────────
            container.on('pointerover', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1.07,
                    scaleY: 1.07,
                    y: yTarjeta - 14,
                    duration: 160,
                    ease: 'Back.easeOut'
                });
                borde.clear();
                borde.lineStyle(7, opcion.colorBorde, 1);
                borde.strokeRoundedRect(-anchoTarjeta / 2, -altoTarjeta / 2, anchoTarjeta, altoTarjeta, 22);
                btnBg.clear();
                btnBg.fillStyle(0xffffff, 0.9);
                btnBg.fillRoundedRect(-55, 118, 110, 38, 10);
            });

            container.on('pointerout', () => {
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    y: yTarjeta,
                    duration: 160,
                    ease: 'Back.easeOut'
                });
                borde.clear();
                borde.lineStyle(5, opcion.colorBorde, 1);
                borde.strokeRoundedRect(-anchoTarjeta / 2, -altoTarjeta / 2, anchoTarjeta, altoTarjeta, 22);
                btnBg.clear();
                btnBg.fillStyle(opcion.colorBorde, 1);
                btnBg.fillRoundedRect(-55, 118, 110, 38, 10);
            });

            container.on('pointerdown', () => {
                this._seleccionarTipo(opcion, container);
            });

            this.containersTarjetas.push(container);
        });
    }

    _seleccionarTipo(opcion, container) {
        // Evitar doble click
        if (this._transitando) return;
        this._transitando = true;

        // Efecto visual de press
        this.tweens.add({
            targets: container,
            scaleX: 0.92,
            scaleY: 0.92,
            duration: 80,
            yoyo: true,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.cameras.main.fadeOut(300, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    this.scene.start(opcion.escena, {
                        avatarKey: localStorage.getItem('muchbits-avatar') || 'user_default'
                    });
                });
            }
        });
    }

    _crearBotonRegreso() {
        const btnBg = this.add.graphics().setDepth(6);
        const _dibujarBtn = (hover) => {
            btnBg.clear();
            btnBg.fillStyle(hover ? 0x7a4010 : 0x3b1e08, 0.9);
            btnBg.fillRoundedRect(30, 728, 190, 44, 12);
            btnBg.lineStyle(3, hover ? 0xffd700 : 0xc8832a, 1);
            btnBg.strokeRoundedRect(30, 728, 190, 44, 12);
        };
        _dibujarBtn(false);

        const btnTexto = this.add.text(125, 750, '◄ SALIR DE SALA', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f0d080'
        }).setOrigin(0.5).setDepth(7);

        const zona = this.add.zone(125, 750, 190, 44)
            .setInteractive({ useHandCursor: true })
            .setDepth(7);

        zona.on('pointerover', () => {
            _dibujarBtn(true);
            btnTexto.setStyle({ fill: '#ffffff' });
        });
        zona.on('pointerout', () => {
            _dibujarBtn(false);
            btnTexto.setStyle({ fill: '#f0d080' });
        });
        zona.on('pointerdown', () => this._salirDeSala());

        this.input.keyboard.on('keydown-ESC', () => this._salirDeSala());
    }

    _salirDeSala() {
        if (this._transitando) return;
        this._transitando = true;
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EscenaJuego', {
                avatarKey: localStorage.getItem('muchbits-avatar') || 'user_default',
                posInicial: { x: 1400, y: 900 },
                ignoreEscape: true
            });
        });
    }

    _animarEntrada() {
        this.cameras.main.fadeIn(500, 0, 0, 0);

        this.containersTarjetas.forEach((container, i) => {
            const yFinal = container.y;
            container.y -= 280;
            container.setAlpha(0);
            this.tweens.add({
                targets: container,
                y: yFinal,
                alpha: 1,
                duration: 650,
                ease: 'Bounce.easeOut',
                delay: 200 + i * 130
            });
        });
    }
}
