class EscenaMenu extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaMenu' });
    }

    preload() {
        this.load.image('arbusto', 'pictures/arbusto.png');
        this.load.image('letrero_much', 'pictures/Letrero_MUCH.png');
        this.load.spritesheet('dinobit-menu', 'pictures/dinosaur-run.png', {
            frameWidth: 396,
            frameHeight: 396
        });

        // Terodáctilo para animar el cielo del menú
        this.load.spritesheet('terodactilo-menu', 'pictures/terodactile.png', {
            frameWidth: 543,
            frameHeight: 724
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
        this.creditosAbiertos = false;

        // 1. Fondo atmosférico Arcade con estrellas y partículas flotantes
        this.crearFondoArcade();

        // 2. Animaciones de sprites (Dino, Terodáctilo y Avatares)
        this.crearAnimaciones();

        // 3. Terodáctilo volando en el cielo del menú
        this.iniciarTerodactiloVolador();

        // 4. Letrero MUCH estructurado sobre los avatares con efecto suspendido/hover
        this.crearLetreroSobreAvatares();

        // 5. Selector de avatares animados bajo el arco del letrero
        this.crearSelectorAvatares();

        // 6. Botones de acción principales (Iniciar, Sala Energía, Créditos)
        this.crearBotonesMenu();

        // 7. Suelo, arbustos animados y dinosaurio corredor en el piso
        this.crearSueloYDinoCorredor();

        // 8. Ventana modal de créditos interactiva
        this.crearModalCreditos();

        // 9. Atajos de teclado
        this.configurarTeclado();
    }

    update(time, delta) {
        // Soporte para controles móviles virtuales en pantalla
        if (window.mobileControls?.consume('enter')) {
            this.iniciarJuego();
        }
        if (window.mobileControls?.consume('escape')) {
            this.alternarCreditos();
        }

        // Animación suave de partículas de fondo
        if (this.particulasFondo) {
            this.particulasFondo.forEach((p) => {
                p.y -= p.velocidad;
                p.x += Math.sin(time * 0.002 + p.offset) * 0.4;
                if (p.y < -10) {
                    p.y = 810;
                    p.x = Phaser.Math.Between(10, 990);
                }
            });
        }

        // Pequeñas bocanadas de polvo cuando el dino corre
        if (this.dinoMenu && this.time.now > (this.ultimoPolvoDino || 0) + 180) {
            this.ultimoPolvoDino = this.time.now;
            this.crearBocanadaPolvoDino();
        }
    }

    // ==========================================
    // 1. FONDO Y AMBIENTACIÓN ARCADE
    // ==========================================
    crearFondoArcade() {
        this.cameras.main.setBackgroundColor('#0b0e1b');

        // Gradiente vertical simulado con graphics para dar profundidad cósmica
        const fondoGrad = this.add.graphics().setDepth(0);
        for (let y = 0; y < 800; y += 8) {
            const factor = y / 800;
            const r = Math.floor(Phaser.Math.Linear(11, 26, factor));
            const g = Math.floor(Phaser.Math.Linear(14, 26, factor));
            const b = Math.floor(Phaser.Math.Linear(32, 54, factor));
            const color = (r << 16) | (g << 8) | b;
            fondoGrad.fillStyle(color, 1);
            fondoGrad.fillRect(0, y, 1000, 8);
        }

        // Resplandor central sutil detrás del letrero
        const haloCentral = this.add.graphics().setDepth(0);
        haloCentral.fillStyle(0x3867d6, 0.12);
        haloCentral.fillCircle(500, 240, 260);
        haloCentral.fillStyle(0x20bf6b, 0.08);
        haloCentral.fillCircle(500, 240, 180);

        // Partículas flotantes estilo motas de polvo cibernético/arcade
        this.particulasFondo = [];
        const coloresParticulas = [0x00f2fe, 0xf1c40f, 0xff7675, 0x55efc4, 0xa29bfe];
        for (let i = 0; i < 28; i++) {
            const px = Phaser.Math.Between(20, 980);
            const py = Phaser.Math.Between(20, 780);
            const pr = Phaser.Math.FloatBetween(1.2, 2.8);
            const pColor = Phaser.Utils.Array.GetRandom(coloresParticulas);
            const pGraphics = this.add.circle(px, py, pr, pColor, Phaser.Math.FloatBetween(0.3, 0.8)).setDepth(1);

            this.particulasFondo.push({
                x: px,
                y: py,
                velocidad: Phaser.Math.FloatBetween(0.3, 0.9),
                offset: Phaser.Math.FloatBetween(0, 10),
                grafico: pGraphics
            });
        }

        // Encabezado retro sutil en la parte superior
        this.add.text(500, 25, '★ MUCHBITS • ARCADE UNIVERSE ★', {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#7ed6df',
            letterSpacing: 2
        }).setOrigin(0.5).setDepth(2).setAlpha(0.85);
    }

    // ==========================================
    // 2. CREACIÓN DE ANIMACIONES
    // ==========================================
    crearAnimaciones() {
        // Dino corredor en el menú
        if (!this.anims.exists('dino-menu-corriendo')) {
            this.anims.create({
                key: 'dino-menu-corriendo',
                frames: this.anims.generateFrameNumbers('dinobit-menu', { start: 0, end: 12 }),
                frameRate: 14,
                repeat: -1
            });
        }

        // Terodáctilo volador en el cielo
        if (!this.anims.exists('terodactilo-menu-vuelo')) {
            this.anims.create({
                key: 'terodactilo-menu-vuelo',
                frames: this.anims.generateFrameNumbers('terodactilo-menu', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Animaciones vivas para los avatares (caminando en su lugar / idle hacia el frente)
        this.avatarOpciones.forEach((avatarKey) => {
            const animKey = `avatar-menu-idle-${avatarKey}`;
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: this.anims.generateFrameNumbers(`avatar-${avatarKey}`, { start: 0, end: 3 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });
    }

    // ==========================================
    // 3. TERODÁCTILO VOLANDO EN EL CIELO
    // ==========================================
    iniciarTerodactiloVolador() {
        this.terodactilo = this.add.sprite(1100, 75, 'terodactilo-menu', 0)
            .setDisplaySize(90, 60)
            .setDepth(2)
            .setAlpha(0.85);

        this.terodactilo.play('terodactilo-menu-vuelo');
        this.lanzarVueloTerodactilo();
    }

    lanzarVueloTerodactilo() {
        const alturaY = Phaser.Math.Between(55, 100);
        this.terodactilo.setPosition(1100, alturaY);
        this.terodactilo.setFlipX(false);

        // Vuelo sinusoidal cruzando la pantalla de derecha a izquierda
        this.tweens.add({
            targets: this.terodactilo,
            x: -120,
            y: alturaY + Phaser.Math.Between(-15, 15),
            duration: Phaser.Math.Between(11000, 14000),
            ease: 'Linear',
            onComplete: () => {
                this.time.delayedCall(Phaser.Math.Between(8000, 15000), () => {
                    this.lanzarVueloTerodactilo();
                });
            }
        });
    }

    // ==========================================
    // 4. LETRERO MUCH SOBRE LOS AVATARES
    // ==========================================
    crearLetreroSobreAvatares() {
        // Creamos un contenedor para animar de forma sincronizada el letrero y sus efectos suspendidos
        // Centrado respecto al arco de avatares (507, 235) para equilibrar los postes a los laterales
        this.contenedorLetrero = this.add.container(507, 235).setDepth(6);

        // Cadenas o tensores de suspensión desde el techo que sostienen el letrero sobre los personajes
        const tensores = this.add.graphics();
        tensores.lineStyle(3, 0x4b6584, 0.7);
        tensores.strokeLineShape(new Phaser.Geom.Line(280, 0, 280, 80));
        tensores.strokeLineShape(new Phaser.Geom.Line(720, 0, 720, 80));
        tensores.lineStyle(2, 0xd1d8e0, 0.9);
        for (let y = 10; y < 75; y += 14) {
            tensores.strokeCircle(280, y, 3);
            tensores.strokeCircle(720, y, 3);
        }
        tensores.setDepth(3);

        // Sombra proyectada del letrero sobre el fondo y los avatares (alineada con la textura 1024x512)
        this.sombraLetrero = this.add.graphics();
        this.sombraLetrero.fillStyle(0x000000, 0.35);
        this.sombraLetrero.fillRoundedRect(-335, -155, 680, 115, 18); // Sombra de la viga MUCH
        this.sombraLetrero.fillEllipse(-268, 175, 80, 22);            // Sombra poste izquierdo
        this.sombraLetrero.fillEllipse(255, 175, 75, 22);             // Sombra poste derecho (columna grabada)
        this.contenedorLetrero.add(this.sombraLetrero);

        // Resplandor neón suave detrás del letrero para resaltar las letras MUCH centradas
        this.brilloLetrero = this.add.graphics();
        this.brilloLetrero.fillStyle(0xff3838, 0.12);
        this.brilloLetrero.fillRoundedRect(-185, -145, 325, 75, 16);
        this.brilloLetrero.fillStyle(0x00f2fe, 0.15);
        this.brilloLetrero.fillCircle(-18, -108, 80);
        this.contenedorLetrero.add(this.brilloLetrero);

        // Imagen del letrero con proporciones exactas para la nueva textura (1024 x 512 -> 910 x 416)
        // La viga superior con "MUCH" queda encima de los personajes y los postes enmarcan los laterales simétricamente
        this.spriteLetrero = this.add.image(0, 0, 'letrero_much')
            .setDisplaySize(910, 416);
        this.contenedorLetrero.add(this.spriteLetrero);

        // Placa arcade suplementaria que complementa el letrero con el nombre "MuchBits"
        // Ubicada en la viga entre la letra H y el poste derecho tallado
        const placaBits = this.add.container(180, -108);
        const fondoPlaca = this.add.graphics();
        fondoPlaca.fillStyle(0x130f40, 0.95);
        fondoPlaca.fillRoundedRect(-45, -14, 90, 28, 8);
        fondoPlaca.lineStyle(2, 0xf1c40f, 1);
        fondoPlaca.strokeRoundedRect(-45, -14, 90, 28, 8);
        const textoBits = this.add.text(0, 0, 'BITS', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        placaBits.add([fondoPlaca, textoBits]);
        this.contenedorLetrero.add(placaBits);

        // Animación suave de suspensión (balanceo/flotación) para simular estar flotando sobre los avatares
        this.tweens.add({
            targets: this.contenedorLetrero,
            y: 242,
            angle: { from: -0.5, to: 0.5 },
            duration: 2600,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Animación de pulso de neón detrás del letrero
        this.tweens.add({
            targets: this.brilloLetrero,
            alpha: { from: 0.5, to: 1 },
            duration: 1800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    // ==========================================
    // 5. SELECTOR DE AVATARES ANIMADOS
    // ==========================================
    crearSelectorAvatares() {
        // Título del selector ubicado justo bajo la viga del letrero
        this.tituloSelector = this.add.text(500, 222, '▼  ELIGE TU AVATAR  ▼', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f8c291',
            stroke: '#1e272e',
            strokeThickness: 3,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
        }).setOrigin(0.5).setDepth(7);

        // Pulso sutil en el texto "Elige tu avatar"
        this.tweens.add({
            targets: this.tituloSelector,
            scale: { from: 0.96, to: 1.04 },
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Tarima / pedestal arcade donde se apoyan los avatares y los postes
        const tarima = this.add.graphics().setDepth(3);
        // Sombra de la tarima
        tarima.fillStyle(0x05070e, 0.6);
        tarima.fillRoundedRect(220, 395, 560, 22, 11);
        // Base de tarima tecnológica
        tarima.fillStyle(0x192a56, 0.9);
        tarima.fillRoundedRect(225, 386, 550, 16, 8);
        tarima.lineStyle(2, 0x00d2d3, 0.7);
        tarima.strokeRoundedRect(225, 386, 550, 16, 8);

        this.avatarItems = [];
        const nombresAvatares = {
            'user_default': 'CLÁSICO',
            'user_male': 'CHICO',
            'user_female': 'CHICA'
        };

        const avatarY = 328;
        const coordsX = [355, 500, 645];

        this.avatarOpciones.forEach((avatarKey, index) => {
            const avatarX = coordsX[index];

            // 1. Pedestal iluminado para cada avatar
            const pedestal = this.add.graphics().setDepth(4);
            this.dibujarPedestal(pedestal, avatarX, avatarY + 44, avatarKey === this.avatarSeleccionado);

            // 2. Halo/Aura de selección animado
            const auraSeleccion = this.add.circle(avatarX, avatarY + 10, 48, 0xf1c40f, 0.18)
                .setDepth(4)
                .setVisible(avatarKey === this.avatarSeleccionado);

            if (avatarKey === this.avatarSeleccionado) {
                this.tweens.add({
                    targets: auraSeleccion,
                    scale: { from: 0.85, to: 1.15 },
                    alpha: { from: 0.35, to: 0.05 },
                    duration: 1200,
                    yoyo: true,
                    repeat: -1
                });
            }

            // 3. Sprite del avatar animado caminando en su lugar
            const avatarSprite = this.add.sprite(avatarX, avatarY, `avatar-${avatarKey}`)
                .setDisplaySize(86, 86)
                .setDepth(5)
                .setInteractive({ useHandCursor: true });

            avatarSprite.play(`avatar-menu-idle-${avatarKey}`);

            // 4. Etiqueta con el nombre del personaje
            const badge = this.add.container(avatarX, avatarY + 54).setDepth(5);
            const badgeFondo = this.add.graphics();
            const esActivo = avatarKey === this.avatarSeleccionado;
            badgeFondo.fillStyle(esActivo ? 0xf1c40f : 0x222f3e, 0.95);
            badgeFondo.fillRoundedRect(-42, -11, 84, 22, 6);
            badgeFondo.lineStyle(2, esActivo ? 0xffffff : 0x576574, 1);
            badgeFondo.strokeRoundedRect(-42, -11, 84, 22, 6);

            const badgeTexto = this.add.text(0, 0, nombresAvatares[avatarKey] || avatarKey.toUpperCase(), {
                fontSize: '11px',
                fontFamily: '"Press Start 2P", monospace',
                fill: esActivo ? '#1e272e' : '#c8d6e5',
                fontStyle: 'bold'
            }).setOrigin(0.5);

            badge.add([badgeFondo, badgeTexto]);

            // Efecto interactivo al pasar el cursor (Hover)
            avatarSprite.on('pointerover', () => {
                this.tweens.add({
                    targets: avatarSprite,
                    scale: 1.48,
                    duration: 180,
                    ease: 'Back.easeOut'
                });
            });

            avatarSprite.on('pointerout', () => {
                this.tweens.add({
                    targets: avatarSprite,
                    scale: 1.34,
                    duration: 180,
                    ease: 'Quad.easeOut'
                });
            });

            // Selección al hacer clic
            avatarSprite.on('pointerdown', () => this.seleccionarAvatar(avatarKey));

            this.avatarItems.push({
                key: avatarKey,
                sprite: avatarSprite,
                pedestal: pedestal,
                aura: auraSeleccion,
                badge: badge,
                badgeFondo: badgeFondo,
                badgeTexto: badgeTexto,
                x: avatarX,
                y: avatarY
            });
        });
    }

    dibujarPedestal(graphics, x, y, activo) {
        graphics.clear();
        if (activo) {
            // Anillo exterior brillante dorado
            graphics.lineStyle(4, 0xf1c40f, 1);
            graphics.strokeEllipse(x, y, 92, 34);
            // Centro iluminado
            graphics.fillStyle(0xf39c12, 0.45);
            graphics.fillEllipse(x, y, 88, 30);
            graphics.lineStyle(2, 0xffffff, 0.9);
            graphics.strokeEllipse(x, y, 68, 22);
        } else {
            // Pedestal inactivo elegante
            graphics.lineStyle(3, 0x34495e, 0.8);
            graphics.strokeEllipse(x, y, 84, 30);
            graphics.fillStyle(0x1e272e, 0.5);
            graphics.fillEllipse(x, y, 80, 26);
        }
    }

    seleccionarAvatar(avatarKey) {
        if (this.avatarSeleccionado === avatarKey) {
            // Si ya está seleccionado, hazle un brinco divertido de confirmación
            const item = this.avatarItems.find(i => i.key === avatarKey);
            if (item) this.animarSaltoConfirmacion(item.sprite, item.x, item.y);
            return;
        }

        this.avatarSeleccionado = avatarKey;
        localStorage.setItem('muchbits-avatar', avatarKey);

        const nombresAvatares = {
            'user_default': 'CLÁSICO',
            'user_male': 'CHICO',
            'user_female': 'CHICA'
        };

        this.avatarItems.forEach((item) => {
            const esActivo = item.key === avatarKey;

            // Redibujar pedestal
            this.dibujarPedestal(item.pedestal, item.x, item.y + 44, esActivo);

            // Aura de energía
            item.aura.setVisible(esActivo);
            if (esActivo) {
                this.tweens.killTweensOf(item.aura);
                item.aura.setScale(0.85);
                this.tweens.add({
                    targets: item.aura,
                    scale: { from: 0.85, to: 1.18 },
                    alpha: { from: 0.4, to: 0.05 },
                    duration: 1100,
                    yoyo: true,
                    repeat: -1
                });

                // Salto de alegría y chispas
                this.animarSaltoConfirmacion(item.sprite, item.x, item.y);
                this.crearChispasSeleccion(item.x, item.y);
            }

            // Actualizar badge
            item.badgeFondo.clear();
            item.badgeFondo.fillStyle(esActivo ? 0xf1c40f : 0x222f3e, 0.95);
            item.badgeFondo.fillRoundedRect(-42, -11, 84, 22, 6);
            item.badgeFondo.lineStyle(2, esActivo ? 0xffffff : 0x576574, 1);
            item.badgeFondo.strokeRoundedRect(-42, -11, 84, 22, 6);

            item.badgeTexto.setStyle({
                fill: esActivo ? '#1e272e' : '#c8d6e5'
            });
        });
    }

    animarSaltoConfirmacion(sprite, x, y) {
        this.tweens.add({
            targets: sprite,
            y: y - 18,
            duration: 160,
            yoyo: true,
            ease: 'Back.easeOut'
        });
    }

    crearChispasSeleccion(x, y) {
        for (let i = 0; i < 10; i++) {
            const angulo = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.FloatBetween(25, 55);
            const chispa = this.add.circle(x, y, Phaser.Math.FloatBetween(2, 4), 0xf1c40f, 1).setDepth(8);

            this.tweens.add({
                targets: chispa,
                x: x + Math.cos(angulo) * dist,
                y: y + Math.sin(angulo) * dist - 15,
                alpha: 0,
                scale: 0.2,
                duration: Phaser.Math.Between(400, 650),
                ease: 'Quad.easeOut',
                onComplete: () => chispa.destroy()
            });
        }
    }

    // ==========================================
    // 6. BOTONES DE ACCIÓN PRINCIPALES
    // ==========================================
    crearBotonesMenu() {
        // --- BOTÓN 1: INICIAR JUEGO (Arcade Principal) ---
        const btnIniciar = this.add.container(500, 475).setDepth(7);
        const bgIniciar = this.add.graphics();
        this.dibujarBotonArcade(bgIniciar, 300, 52, 0x27ae60, 0x2ecc71, 0x1abc9c);

        const txtIniciar = this.add.text(0, -5, '▶ INICIAR JUEGO', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            stroke: '#1b4d3e',
            strokeThickness: 3
        }).setOrigin(0.5);

        const subTxtIniciar = this.add.text(0, 14, '[ENTER / ESPACIO]', {
            fontSize: '10px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#a3e4d7'
        }).setOrigin(0.5);

        btnIniciar.add([bgIniciar, txtIniciar, subTxtIniciar]);
        btnIniciar.setSize(300, 52);
        btnIniciar.setInteractive({ useHandCursor: true });

        // Pulso de respiración para llamar a la acción
        this.tweens.add({
            targets: btnIniciar,
            scale: { from: 1, to: 1.03 },
            duration: 900,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        btnIniciar.on('pointerover', () => {
            btnIniciar.setScale(1.07);
            txtIniciar.setStyle({ fill: '#f1c40f' });
        });

        btnIniciar.on('pointerout', () => {
            btnIniciar.setScale(1);
            txtIniciar.setStyle({ fill: '#ffffff' });
        });

        btnIniciar.on('pointerdown', () => this.iniciarJuego());

        // --- BOTÓN 2: SALA ENERGÍA (PRESA) ---
        const btnEnergia = this.add.container(500, 542).setDepth(7);
        const bgEnergia = this.add.graphics();
        this.dibujarBotonArcade(bgEnergia, 360, 42, 0x0c2461, 0x1e3799, 0x00f2fe);

        const txtEnergia = this.add.text(0, 0, '⚡ JUGAR SALA ENERGÍA', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe',
            stroke: '#081c3c',
            strokeThickness: 3
        }).setOrigin(0.5);

        btnEnergia.add([bgEnergia, txtEnergia]);
        btnEnergia.setSize(360, 42);
        btnEnergia.setInteractive({ useHandCursor: true });

        btnEnergia.on('pointerover', () => {
            btnEnergia.setScale(1.05);
            txtEnergia.setStyle({ fill: '#ffffff' });
        });

        btnEnergia.on('pointerout', () => {
            btnEnergia.setScale(1);
            txtEnergia.setStyle({ fill: '#00f2fe' });
        });

        btnEnergia.on('pointerdown', () => {
            localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
            this.scene.start('EscenaEnergia', { avatarKey: this.avatarSeleccionado });
        });

        // --- BOTÓN 3: VER CRÉDITOS ---
        const btnCreditos = this.add.text(500, 604, '★ VER CRÉDITOS [ESC] ★', {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#74b9ff',
            stroke: '#0984e3',
            strokeThickness: 2
        }).setOrigin(0.5).setDepth(7).setInteractive({ useHandCursor: true });

        btnCreditos.on('pointerover', () => btnCreditos.setStyle({ fill: '#ffeaa7' }));
        btnCreditos.on('pointerout', () => btnCreditos.setStyle({ fill: '#74b9ff' }));
        btnCreditos.on('pointerdown', () => this.alternarCreditos());
    }

    dibujarBotonArcade(graphics, ancho, alto, colorFondo, colorTop, colorBorde) {
        graphics.clear();
        const medioAncho = ancho / 2;
        const medioAlto = alto / 2;

        // Sombra de botón
        graphics.fillStyle(0x0a0c10, 0.5);
        graphics.fillRoundedRect(-medioAncho + 2, -medioAlto + 4, ancho, alto, 12);

        // Cuerpo base
        graphics.fillStyle(colorFondo, 1);
        graphics.fillRoundedRect(-medioAncho, -medioAlto, ancho, alto, 12);

        // Brillo superior
        graphics.fillStyle(colorTop, 0.6);
        graphics.fillRoundedRect(-medioAncho + 3, -medioAlto + 2, ancho - 6, (alto / 2) - 3, { tl: 10, tr: 10, bl: 3, br: 3 });

        // Borde neón
        graphics.lineStyle(3, colorBorde, 1);
        graphics.strokeRoundedRect(-medioAncho, -medioAlto, ancho, alto, 12);
    }

    // ==========================================
    // 7. SUELO, ARBUSTOS Y DINOSAURIO CORREDOR
    // ==========================================
    crearSueloYDinoCorredor() {
        // Franja de tierra y pasto inferior
        const suelo = this.add.graphics().setDepth(2);
        suelo.fillStyle(0x192a56, 1);
        suelo.fillRect(0, 755, 1000, 45);
        suelo.fillStyle(0x00d2d3, 0.9);
        suelo.fillRect(0, 753, 1000, 3);

        // Arbustos decorativos con leve bamboleo de viento
        this.arbustos = [];
        for (let x = 40; x <= 960; x += 90) {
            const arbusto = this.add.image(x, 758, 'arbusto')
                .setDisplaySize(62, 62)
                .setAlpha(0.85)
                .setDepth(2);

            this.arbustos.push(arbusto);

            // Balanceo sutil de viento
            this.tweens.add({
                targets: arbusto,
                angle: { from: -1.8, to: 1.8 },
                duration: Phaser.Math.Between(2200, 3200),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        // Dinosaurio corriendo en la parte inferior
        this.dinoMenu = this.add.sprite(-80, 712, 'dinobit-menu')
            .setDisplaySize(130, 130)
            .setDepth(3);

        this.dinoVaHaciaLaDerecha = true;
        this.moverDinoMenu();
    }

    moverDinoMenu() {
        const vaHaciaLaDerecha = this.dinoVaHaciaLaDerecha;
        this.dinoMenu
            .setFlipX(vaHaciaLaDerecha)
            .play('dino-menu-corriendo', true);

        this.tweens.add({
            targets: this.dinoMenu,
            x: vaHaciaLaDerecha ? 1060 : -60,
            y: vaHaciaLaDerecha ? 712 : 710,
            duration: 6800,
            ease: 'Linear',
            onComplete: () => {
                this.dinoVaHaciaLaDerecha = !this.dinoVaHaciaLaDerecha;
                this.moverDinoMenu();
            }
        });
    }

    crearBocanadaPolvoDino() {
        if (!this.dinoMenu) return;
        const xOffset = this.dinoVaHaciaLaDerecha ? -25 : 25;
        const polvo = this.add.circle(this.dinoMenu.x + xOffset, 748, Phaser.Math.FloatBetween(3, 5), 0x74b9ff, 0.6).setDepth(2);

        this.tweens.add({
            targets: polvo,
            x: polvo.x + (this.dinoVaHaciaLaDerecha ? -18 : 18),
            y: polvo.y - 10,
            alpha: 0,
            scale: 1.8,
            duration: 350,
            onComplete: () => polvo.destroy()
        });
    }

    // ==========================================
    // 8. MODAL DE CRÉDITOS INTERACTIVA
    // ==========================================
    crearModalCreditos() {
        this.modalCreditos = this.add.container(500, 400).setDepth(15).setVisible(false).setAlpha(0);

        // Fondo oscuro semitransparente que bloquea el fondo
        const telon = this.add.graphics();
        telon.fillStyle(0x000000, 0.7);
        telon.fillRect(-500, -400, 1000, 800);
        telon.setInteractive(new Phaser.Geom.Rectangle(-500, -400, 1000, 800), Phaser.Geom.Rectangle.Contains);

        // Tarjeta principal arcade de créditos
        const card = this.add.graphics();
        card.fillStyle(0x130f40, 0.98);
        card.fillRoundedRect(-280, -170, 560, 340, 16);
        card.lineStyle(4, 0x00f2fe, 1);
        card.strokeRoundedRect(-280, -170, 560, 340, 16);

        const titulo = this.add.text(0, -125, '★ MUCHBITS ARCADE ★', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        const sub = this.add.text(0, -90, 'Departamento SATA y Colaboradores', {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe'
        }).setOrigin(0.5);

        const nombres = this.add.text(0, -10, '• Gabriel Reyes\n\n• Leonardo Ruiz\n\n• Fatima Bustamante', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 8
        }).setOrigin(0.5);

        const pie = this.add.text(0, 80, 'Desarrollado para la difusión científica y cultural', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fill: '#a4b0be'
        }).setOrigin(0.5);

        const btnCerrar = this.add.text(0, 125, '[ CERRAR ]', {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#e74c3c'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        btnCerrar.on('pointerover', () => btnCerrar.setStyle({ fill: '#ff7675' }));
        btnCerrar.on('pointerout', () => btnCerrar.setStyle({ fill: '#e74c3c' }));
        btnCerrar.on('pointerdown', () => this.alternarCreditos());
        telon.on('pointerdown', () => this.alternarCreditos());

        this.modalCreditos.add([telon, card, titulo, sub, nombres, pie, btnCerrar]);
    }

    alternarCreditos() {
        this.creditosAbiertos = !this.creditosAbiertos;

        if (this.creditosAbiertos) {
            this.modalCreditos.setVisible(true);
            this.modalCreditos.setScale(0.92);
            this.tweens.add({
                targets: this.modalCreditos,
                alpha: 1,
                scale: 1,
                duration: 220,
                ease: 'Back.easeOut'
            });
        } else {
            this.tweens.add({
                targets: this.modalCreditos,
                alpha: 0,
                scale: 0.92,
                duration: 160,
                ease: 'Quad.easeIn',
                onComplete: () => {
                    this.modalCreditos.setVisible(false);
                }
            });
        }
    }

    // ==========================================
    // 9. ATAJOS DE TECLADO Y FLUJO
    // ==========================================
    configurarTeclado() {
        this.input.keyboard.on('keydown-ENTER', () => this.iniciarJuego());
        this.input.keyboard.on('keydown-SPACE', () => this.iniciarJuego());
        this.input.keyboard.on('keydown-ESC', () => this.alternarCreditos());
    }

    iniciarJuego() {
        localStorage.setItem('muchbits-avatar', this.avatarSeleccionado);
        this.scene.start('EscenaJuego', { avatarKey: this.avatarSeleccionado });
    }
}
