/**
 * MuchBits - Sala C: Desarrollo Sustentable
 * Juego: Conexión de Energía Limpia (Nivel 1: Cañón de Paneles Solares)
 * 
 * Mecánica principal:
 * - El jugador carga un cable de suministro eléctrico desde el generador inicial en el acantilado izquierdo.
 * - Debe cruzar plataformas flotantes (estáticas, móviles horizontales y elevadizas verticales).
 * - Esquiva espectros de viento/tormenta que patrullan el aire.
 * - Conecta el cable a la estación de paneles solares en el acantilado derecho para energizar la máquina.
 * - Físicas arcade de salto, cable dinámico con catenaria, HUD retro estilo arcade con monitor CRT.
 */

class EscenaSustentable extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSustentable' });
    }

    init(data) {
        this.origen = data && data.origen ? data.origen : 'EscenaJuego';
        this.avatarKey = data && data.avatarKey ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_male');
        this.nivelActual = 1;
        this.maxNiveles = 3;
    }

    preload() {
        // Fondo oficial del Nivel 1 (Cañón del Sumidero / Paneles Solares)
        this.load.image('fondo_sustentable_n1', 'pictures/sala_desarrollo_sustentable/Paisaje_Panel_Canon_Sumidero.png');

        // Texturas oficiales de plataformas flotantes (diseñadas por los artistas)
        this.load.image('plat_estable', 'pictures/sala_desarrollo_sustentable/plataforma_estable.png');
        this.load.image('plat_movimiento', 'pictures/sala_desarrollo_sustentable/plataforma_movimiento.png');
        this.load.image('plat_fragil', 'pictures/sala_desarrollo_sustentable/plataforma_fragil.png');

        // Spritesheet del avatar seleccionado (4x4 frames de 64x64)
        this.load.spritesheet(`avatar-${this.avatarKey}`, `pictures/${this.avatarKey}.png`, {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    create() {
        // Inicializar sintetizador de audio procedural (Web Audio API)
        this.initAudioSynthesizer();

        // 1. Estado del juego
        this.vidas = 3;
        this.maxVidas = 3;
        this.puntuacion = 0;
        this.tiempoRestante = 55; // 55 segundos para el Nivel 1 extendido
        this.juegoTerminado = false;
        this.juegoPausado = false;
        this.nivelCompletado = false;
        this.invulnerable = false;
        this.cableConectado = false;
        this.distanciaPorcentaje = 0;

        // Longitud del cable en pies
        this.longitudCableFT = 0;
        this.maxLongitudCableFT = 140; // Límite amplio para el Nivel 1 extendido

        // Dimensiones extendidas del mundo (proporcional al fondo original 1698x926)
        this.anchoMundo = 1500;
        this.altoMundo = 800;
        this.physics.world.setBounds(0, 0, this.anchoMundo, this.altoMundo);

        // 2. Generar texturas procedurales auxiliares (Plataformas, Generador, Estación Solar, Espectros, HUD)
        this.generarTexturasSustentables();

        // 3. Crear animaciones de sprites
        this.crearAnimaciones();

        // 4. Fondo del escenario con encuadre panorámico
        this.crearFondo();

        // 5. Grupos de físicas y plataformas del Nivel 1
        this.crearNivel1();

        // 6. Crear jugador con arnés/mochila de cable
        this.crearJugador();

        // Configuración de la cámara y seguimiento suave al jugador
        this.cameras.main.setBounds(0, 0, this.anchoMundo, this.altoMundo);
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
        this.cameras.main.setDeadzone(100, 120);

        // 7. Colisiones y físicas
        this.configurarColisiones();

        // 8. Gráficos dinámicos del cable eléctrico
        this.graficosCable = this.add.graphics().setDepth(8);

        // 9. Enemigos patrulleros (Espectros de viento/tormenta)
        this.crearEnemigos();

        // 10. Orbes de energía limpia coleccionables (bonus)
        this.crearColeccionables();

        // 11. HUD Retro Arcade estilo pantalla CRT
        this.crearHUDArcade();

        // 12. Configuración de controles (Teclado + Touch / D-Pad)
        this.configurarControles();

        // 13. Temporizador de cuenta regresiva
        this.iniciarTemporizador();

        // 14. Modales de victoria y game over
        this.crearModalesFinDeJuego();
    }

    /* =========================================================================
     * TEXTURAS PROCEDURALES RETRO PIXEL-ART
     * ========================================================================= */
    generarTexturasSustentables() {
        // --- Generar texturas de resolución nativa de juego (escala 1:1) a partir de los assets oficiales ---
        if (this.textures.exists('plat_estable') && !this.textures.exists('plat_estable_game')) {
            const src = this.textures.get('plat_estable').getSourceImage();
            const canvas = this.textures.createCanvas('plat_estable_game', 135, 52);
            if (canvas && canvas.context) {
                canvas.context.drawImage(src, 0, 0, 135, 52);
                canvas.refresh();
            }
        }

        if (this.textures.exists('plat_movimiento') && !this.textures.exists('plat_movimiento_game')) {
            const src = this.textures.get('plat_movimiento').getSourceImage();
            // Versión mediana para plataformas horizontales (135x52)
            const canvasMed = this.textures.createCanvas('plat_movimiento_game', 135, 52);
            if (canvasMed && canvasMed.context) {
                canvasMed.context.drawImage(src, 0, 0, 135, 52);
                canvasMed.refresh();
            }

            // Versión para plataformas verticales elevadizas (100x44)
            const canvasSm = this.textures.createCanvas('plat_movimiento_sm_game', 100, 44);
            if (canvasSm && canvasSm.context) {
                canvasSm.context.drawImage(src, 0, 0, 100, 44);
                canvasSm.refresh();
            }
        }

        // --- 1. Plataforma de roca flotante con césped (120x65) — Respaldo si no hay textura oficial ---
        if (!this.textures.exists('plat_estable') && !this.textures.exists('plataforma_flotante_med')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Sombra inferior suave
            c.fillStyle(0x1e1510, 0.5);
            c.fillEllipse(60, 60, 100, 10);

            // Silueta de roca de tierra/cañón
            c.fillStyle(0x794628, 1);
            c.beginPath();
            c.moveTo(8, 14);
            c.lineTo(112, 14);
            c.lineTo(100, 36);
            c.lineTo(76, 56);
            c.lineTo(60, 60);
            c.lineTo(44, 56);
            c.lineTo(20, 36);
            c.closePath();
            c.fill();

            // Estratos y textura de roca sedimentaria del cañón
            c.fillStyle(0xa05e35, 1);
            c.fillRect(18, 16, 84, 10);
            c.fillStyle(0x5c331a, 1);
            c.fillRect(26, 30, 68, 12);
            c.fillStyle(0x3e2211, 1);
            c.fillRect(44, 44, 32, 10);

            // Borde rocoso oscuro pixelado
            c.lineStyle(3, 0x1f140d, 1);
            c.strokePath();

            // Césped verde vibrante en la superficie superior
            c.fillStyle(0x2ecc71, 1);
            c.fillRoundedRect(4, 8, 112, 10, 4);
            c.fillStyle(0x7bed9f, 1);
            c.fillRoundedRect(6, 9, 108, 4, 2);

            // Pequeñas briznas de hierba que cuelgan
            c.fillStyle(0x27ae60, 1);
            for (let x = 12; x < 108; x += 12) {
                c.fillTriangle(x, 18, x + 4, 18, x + 2, 24);
            }

            c.generateTexture('plataforma_flotante_med', 120, 65);
            c.destroy();
        }

        // --- 2. Plataforma de roca flotante pequeña (80x55) — Respaldo si no hay textura oficial ---
        if (!this.textures.exists('plat_movimiento') && !this.textures.exists('plataforma_flotante_sm')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x794628, 1);
            c.beginPath();
            c.moveTo(6, 12);
            c.lineTo(74, 12);
            c.lineTo(64, 32);
            c.lineTo(48, 48);
            c.lineTo(40, 52);
            c.lineTo(32, 48);
            c.lineTo(16, 32);
            c.closePath();
            c.fill();

            c.fillStyle(0xa05e35, 1);
            c.fillRect(14, 14, 52, 9);
            c.fillStyle(0x4a2915, 1);
            c.fillRect(24, 28, 32, 12);

            c.lineStyle(3, 0x1f140d, 1);
            c.strokePath();

            c.fillStyle(0x2ecc71, 1);
            c.fillRoundedRect(3, 7, 74, 9, 3);
            c.fillStyle(0x7bed9f, 1);
            c.fillRoundedRect(5, 8, 70, 3, 2);

            c.generateTexture('plataforma_flotante_sm', 80, 55);
            c.destroy();
        }

        // --- 3. Carrete / Generador Eléctrico de Cable (Acantilado Izquierdo) (72x64) ---
        if (!this.textures.exists('carrete_generador')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Carcasa metálica reforzada
            c.fillStyle(0x2d3436, 1);
            c.fillRoundedRect(6, 12, 60, 48, 6);
            c.lineStyle(3, 0xf1c40f, 1);
            c.strokeRoundedRect(6, 12, 60, 48, 6);

            // Carrete cilíndrico interno con bobina de cable amarillo
            c.fillStyle(0x1e272e, 1);
            c.fillCircle(36, 36, 18);
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(36, 36, 13);
            c.fillStyle(0xdfe6e9, 1);
            c.fillCircle(36, 36, 6);

            // Boquilla de salida del cable a la derecha
            c.fillStyle(0x636e72, 1);
            c.fillRoundedRect(60, 30, 10, 12, 3);
            c.fillStyle(0xf1c40f, 1);
            c.fillRect(66, 34, 4, 4);

            // Luz LED de estado (energía lista)
            c.fillStyle(0x2ecc71, 1);
            c.fillCircle(16, 20, 3);
            c.fillStyle(0xffffff, 0.8);
            c.fillCircle(15, 19, 1);

            // Pantalla digital LCD pequeña
            c.fillStyle(0x0984e3, 0.9);
            c.fillRect(28, 16, 26, 7);

            c.generateTexture('carrete_generador', 72, 64);
            c.destroy();
        }

        // --- 4. Estación Receptora de Energía Solar (Acantilado Derecho) (140x110) ---
        if (!this.textures.exists('estacion_solar')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });

            // Postes metálicos de soporte para los paneles
            c.fillStyle(0x718093, 1);
            c.fillRect(18, 50, 6, 50);
            c.fillRect(52, 45, 6, 55);
            c.fillRect(110, 48, 6, 52);

            // Panel Solar 1 (Izquierdo inclinado)
            c.fillStyle(0x192a56, 1);
            c.fillRoundedRect(4, 18, 54, 34, 4);
            c.lineStyle(2, 0x00d2d3, 1);
            c.strokeRoundedRect(4, 18, 54, 34, 4);
            // Cuadrícula fotovoltaica
            c.lineStyle(1, 0x54a0ff, 0.8);
            c.strokeLineShape(new Phaser.Geom.Line(22, 18, 22, 52));
            c.strokeLineShape(new Phaser.Geom.Line(40, 18, 40, 52));
            c.strokeLineShape(new Phaser.Geom.Line(4, 35, 58, 35));

            // Panel Solar 2 (Derecho inclinado)
            c.fillStyle(0x192a56, 1);
            c.fillRoundedRect(68, 12, 66, 38, 4);
            c.lineStyle(2, 0x00d2d3, 1);
            c.strokeRoundedRect(68, 12, 66, 38, 4);
            // Cuadrícula fotovoltaica
            c.lineStyle(1, 0x54a0ff, 0.8);
            c.strokeLineShape(new Phaser.Geom.Line(90, 12, 90, 50));
            c.strokeLineShape(new Phaser.Geom.Line(112, 12, 112, 50));
            c.strokeLineShape(new Phaser.Geom.Line(68, 31, 134, 31));

            // Terminal / Batería de Almacenamiento Central con Display
            c.fillStyle(0x2f3640, 1);
            c.fillRoundedRect(56, 56, 50, 48, 6);
            c.lineStyle(2, 0x00a8ff, 1);
            c.strokeRoundedRect(56, 56, 50, 48, 6);

            // Pantalla de estado de carga con icono de rayo
            c.fillStyle(0x1e272e, 1);
            c.fillRect(64, 62, 34, 22);
            c.fillStyle(0xf1c40f, 1);
            // Símbolo de rayo amarillo ⚡
            c.fillPoints([
                { x: 82, y: 64 },
                { x: 74, y: 74 },
                { x: 81, y: 74 },
                { x: 77, y: 82 },
                { x: 88, y: 71 },
                { x: 82, y: 71 }
            ], true);

            // Puerto / Enchufe de conexión en el costado izquierdo
            c.fillStyle(0x718093, 1);
            c.fillRoundedRect(48, 76, 10, 14, 3);
            c.fillStyle(0x00f2fe, 1);
            c.fillCircle(52, 83, 3);

            c.generateTexture('estacion_solar', 140, 110);
            c.destroy();
        }

        // --- 5. Espectro / Fantasma de Viento y Tormenta (Enemigo) (48x44) ---
        if (!this.textures.exists('espectro_tormenta')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            // Aura exterior translúcida
            c.fillStyle(0xa29bfe, 0.35);
            c.fillCircle(24, 22, 20);

            // Cuerpo nuboso espectral blanco/azulado
            c.fillStyle(0xf1f2f6, 1);
            c.fillCircle(24, 18, 14);
            c.fillCircle(14, 22, 10);
            c.fillCircle(34, 22, 10);

            // Colita de viento flotante hacia atrás
            c.fillPoints([
                { x: 12, y: 26 },
                { x: 4, y: 22 },
                { x: 10, y: 32 },
                { x: 24, y: 30 }
            ], true);

            // Ojos enojados con brillo rojo arcade
            c.fillStyle(0xd63031, 1);
            c.fillEllipse(18, 17, 3.5, 4.5);
            c.fillEllipse(30, 17, 3.5, 4.5);
            c.fillStyle(0xffffff, 0.8);
            c.fillCircle(17, 16, 1.2);
            c.fillCircle(29, 16, 1.2);

            // Cejas fruncidas de enojo
            c.lineStyle(2, 0x2f3542, 1);
            c.strokeLineShape(new Phaser.Geom.Line(14, 12, 20, 15));
            c.strokeLineShape(new Phaser.Geom.Line(34, 12, 28, 15));

            c.generateTexture('espectro_tormenta', 48, 44);
            c.destroy();
        }

        // --- 6. Orbe de Energía Limpia Coleccionable (24x24) ---
        if (!this.textures.exists('orbe_energia')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0x00f2fe, 0.3);
            c.fillCircle(12, 12, 11);
            c.fillStyle(0x00d2d3, 0.8);
            c.fillCircle(12, 12, 8);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(10, 10, 4);
            c.generateTexture('orbe_energia', 24, 24);
            c.destroy();
        }

        // --- 7. Partícula de Chispa Eléctrica (12x12) ---
        if (!this.textures.exists('chispa_cable')) {
            const c = this.make.graphics({ x: 0, y: 0, add: false });
            c.fillStyle(0xf1c40f, 1);
            c.fillCircle(6, 6, 4);
            c.fillStyle(0xffffff, 1);
            c.fillCircle(5, 5, 2);
            c.generateTexture('chispa_cable', 12, 12);
            c.destroy();
        }
    }

    /* =========================================================================
     * ANIMACIONES DE PERSONAJE
     * ========================================================================= */
    crearAnimaciones() {
        const key = `avatar-${this.avatarKey}`;
        const frameDerecha = this.avatarKey === 'user_male' ? 8 : 12;
        const frameIzquierda = this.avatarKey === 'user_male' ? 12 : 8;

        // Caminata hacia la derecha
        if (!this.anims.exists(`${key}-correr-der`)) {
            this.anims.create({
                key: `${key}-correr-der`,
                frames: this.anims.generateFrameNumbers(key, { start: frameDerecha, end: frameDerecha + 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Caminata hacia la izquierda
        if (!this.anims.exists(`${key}-correr-izq`)) {
            this.anims.create({
                key: `${key}-correr-izq`,
                frames: this.anims.generateFrameNumbers(key, { start: frameIzquierda, end: frameIzquierda + 3 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // Reposo / Idle hacia el frente
        if (!this.anims.exists(`${key}-quieto`)) {
            this.anims.create({
                key: `${key}-quieto`,
                frames: [{ key: key, frame: 0 }],
                frameRate: 1
            });
        }

        // Salto
        if (!this.anims.exists(`${key}-salto`)) {
            this.anims.create({
                key: `${key}-salto`,
                frames: [{ key: key, frame: frameDerecha + 1 }],
                frameRate: 1
            });
        }
    }

    /* =========================================================================
     * FONDO DEL ESCENARIO
     * ========================================================================= */
    crearFondo() {
        // Imagen oficial del Cañón con Paneles Solares extendida en proporción natural (1500x800)
        this.fondo = this.add.image(this.anchoMundo / 2, this.altoMundo / 2, 'fondo_sustentable_n1')
            .setDisplaySize(this.anchoMundo, this.altoMundo)
            .setDepth(0);

        // Capa ambiental sutil de puesta de sol cálida
        const filtroAtardecer = this.add.graphics().setDepth(1);
        filtroAtardecer.fillStyle(0xff7675, 0.08);
        filtroAtardecer.fillRect(0, 0, this.anchoMundo, this.altoMundo);

        // Nubes decorativas lejanas que se desplazan suavemente en el horizonte
        this.nubesLejanas = [];
        for (let i = 0; i < 6; i++) {
            const x = Phaser.Math.Between(50, this.anchoMundo - 50);
            const y = Phaser.Math.Between(70, 220);
            const nube = this.add.graphics().setDepth(1).setAlpha(0.5);
            nube.fillStyle(0xffffff, 0.7);
            nube.fillCircle(0, 0, 28);
            nube.fillCircle(24, -4, 20);
            nube.fillCircle(-24, 2, 22);
            nube.fillRoundedRect(-40, 2, 80, 16, 8);
            nube.x = x;
            nube.y = y;
            nube.velocidad = Phaser.Math.FloatBetween(0.15, 0.45);
            this.nubesLejanas.push(nube);
        }
    }

    /* =========================================================================
     * ESTRUCTURA DEL NIVEL 1: PLATAFORMAS ESTÁTICAS, MÓVILES Y ELEVADIZAS
     * ========================================================================= */
    crearNivel1() {
        // Grupo estático para suelo firme y plataformas estáticas
        this.plataformasEstaticas = this.physics.add.staticGroup();

        // Grupo dinámico para plataformas móviles
        this.plataformasMoviles = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // -------------------------------------------------------------
        // 1. Acantilado Izquierdo (Base de inicio con Carrete de Cable)
        // -------------------------------------------------------------
        const acantiladoIzq = this.add.graphics();
        // Sombra y volumen del acantilado
        acantiladoIzq.fillStyle(0x5c331a, 1);
        acantiladoIzq.fillRoundedRect(-20, 560, 180, 280, 14);
        acantiladoIzq.fillStyle(0x794628, 1);
        acantiladoIzq.fillRect(0, 560, 150, 260);
        // Césped superior
        acantiladoIzq.fillStyle(0x2ecc71, 1);
        acantiladoIzq.fillRoundedRect(-10, 552, 165, 18, 6);
        acantiladoIzq.fillStyle(0x7bed9f, 1);
        acantiladoIzq.fillRoundedRect(0, 554, 150, 6, 2);
        acantiladoIzq.setDepth(3);

        // Colisionador físico del acantilado izquierdo
        const colisionadorIzq = this.add.rectangle(75, 570, 150, 36, 0x000000, 0);
        this.physics.add.existing(colisionadorIzq, true);
        this.plataformasEstaticas.add(colisionadorIzq);

        // Carrete Generador de Cable montado en el borde del acantilado
        this.posicionSalidaCable = { x: 135, y: 535 };
        this.carreteGenerador = this.add.image(95, 525, 'carrete_generador')
            .setDisplaySize(72, 64)
            .setDepth(5);

        // LED parpadeante del generador
        this.ledGenerador = this.add.circle(75, 508, 3, 0x2ecc71, 1).setDepth(6);
        this.tweens.add({
            targets: this.ledGenerador,
            alpha: { from: 0.3, to: 1 },
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // -------------------------------------------------------------
        // 2. Acantilado Derecho (Base de destino con Estación Solar)
        // -------------------------------------------------------------
        const acantiladoDer = this.add.graphics();
        acantiladoDer.fillStyle(0x5c331a, 1);
        acantiladoDer.fillRoundedRect(1330, 550, 180, 290, 14);
        acantiladoDer.fillStyle(0x794628, 1);
        acantiladoDer.fillRect(1340, 550, 170, 270);
        // Césped en la cima del acantilado derecho
        acantiladoDer.fillStyle(0x2ecc71, 1);
        acantiladoDer.fillRoundedRect(1330, 542, 180, 18, 6);
        acantiladoDer.fillStyle(0x7bed9f, 1);
        acantiladoDer.fillRoundedRect(1335, 544, 175, 6, 2);
        acantiladoDer.setDepth(3);

        // Colisionador físico del acantilado derecho (superficie plana sólida y segura)
        const colisionadorDer = this.add.rectangle(1415, 560, 170, 36, 0x000000, 0);
        this.physics.add.existing(colisionadorDer, true);
        this.plataformasEstaticas.add(colisionadorDer);

        // Estación Receptora de Energía Solar (ubicada hacia la derecha para dejar espacio libre de parada)
        this.estacionSolar = this.add.image(1435, 492, 'estacion_solar')
            .setDisplaySize(140, 110)
            .setDepth(5);

        // Punto exacto de enchufe de la máquina solar (meta del cable)
        this.posicionEnchufeMeta = { x: 1385, y: 518 };

        // Zona interactiva del receptor para conectar el cable al llegar
        this.zonaConexionTerminal = this.add.zone(1375, 515, 45, 70);
        this.physics.add.existing(this.zonaConexionTerminal, true);

        // Flecha animada / pulso en la terminal de destino
        this.marcadorMeta = this.add.text(1385, 435, '⚡ CONECTA AQUÍ', {
            fontSize: '11px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f',
            stroke: '#1e272e',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(12);

        this.tweens.add({
            targets: this.marcadorMeta,
            y: 427,
            duration: 700,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // -------------------------------------------------------------
        // 3. Plataformas Flotantes Intermedias (Estáticas, Móviles, Elevadizas)
        // -------------------------------------------------------------
        this.listaPlataformasMoviles = [];

        // Plataforma 1 (ESTÁTICA): Escalonada baja cerca del acantilado izquierdo
        this.crearPlataformaEstatica(260, 590, 'plat_estable');

        // Plataforma 2 (MÓVIL HORIZONTAL): Patrulla suave de izquierda a derecha
        this.crearPlataformaMovilHorizontal(430, 515, 'plat_movimiento', 360, 500, 75);

        // Plataforma 3 (ELEVADIZA VERTICAL): Sube y baja entre niveles
        this.crearPlataformaElevadizaVertical(600, 460, 'plat_movimiento', 370, 540, 65);

        // Plataforma 4 (ESTÁTICA ELEVADA): Punto de apoyo alto en medio del cañón
        this.crearPlataformaEstatica(780, 420, 'plat_estable');

        // Plataforma 5 (MÓVIL HORIZONTAL): Patrulla horizontal en el segundo tramo
        this.crearPlataformaMovilHorizontal(960, 510, 'plat_movimiento', 890, 1030, 75);

        // Plataforma 6 (ELEVADIZA VERTICAL): Segunda plataforma elevadiza que sube y baja
        this.crearPlataformaElevadizaVertical(1120, 470, 'plat_movimiento', 380, 550, 65);

        // Plataforma 7 (MÓVIL HORIZONTAL): Enlace final hacia el acantilado solar (patrulla hasta 1265 px)
        this.crearPlataformaMovilHorizontal(1245, 490, 'plat_movimiento', 1180, 1265, 75);
    }

    crearPlataformaEstatica(x, y, textura) {
        // Usar versión de resolución de juego nativa si existe, o el asset original, o el respaldo
        const keyUsada = this.textures.exists('plat_estable_game') ? 'plat_estable_game' : (this.textures.exists('plat_estable') ? 'plat_estable' : textura);
        const plat = this.plataformasEstaticas.create(x, y, keyUsada);
        plat.setDepth(4);

        // Ancho ampliado (135x52) para que no se vea aplastada y brinde excelente área de salto
        plat.setDisplaySize(135, 52);
        plat.refreshBody();

        // Hitbox plano sólido sobre la parte superior del césped
        plat.body.setSize(124, 20);
        plat.body.setOffset(5, 4);
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;
        return plat;
    }

    crearPlataformaMovilHorizontal(x, y, textura, minX, maxX, velocidad) {
        const keyUsada = this.textures.exists('plat_movimiento_game') ? 'plat_movimiento_game' : (this.textures.exists('plat_movimiento') ? 'plat_movimiento' : textura);
        const plat = this.plataformasMoviles.create(x, y, keyUsada);
        plat.setDepth(4);
        plat.setImmovable(true);
        plat.body.allowGravity = false;

        // Ancho ampliado (135x52)
        plat.setDisplaySize(135, 52);

        // Piso sólido garantizado: Si usa plat_movimiento_game, scaleX y scaleY son 1 (sin distorsión)
        if (plat.scaleX === 1) {
            plat.body.setSize(124, 20);
            plat.body.setOffset(5, 4);
        } else {
            // Factor de escala de respaldo para que en cualquier caso el hitbox mida 124x20 px reales
            plat.body.setSize(124 / plat.scaleX, 20 / plat.scaleY);
            plat.body.setOffset(5 / plat.scaleX, 4 / plat.scaleY);
        }

        // Colisión superior sólida para que el jugador nunca caiga al vacío
        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;

        plat.minX = minX;
        plat.maxX = maxX;
        plat.velocidadBase = velocidad;
        plat.body.setVelocityX(velocidad);
        plat.tipoMovimiento = 'horizontal';

        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    crearPlataformaElevadizaVertical(x, y, textura, minY, maxY, velocidad) {
        const keyUsada = this.textures.exists('plat_movimiento_sm_game') ? 'plat_movimiento_sm_game' : (this.textures.exists('plat_movimiento') ? 'plat_movimiento' : textura);
        const plat = this.plataformasMoviles.create(x, y, keyUsada);
        plat.setDepth(4);
        plat.setImmovable(true);
        plat.body.allowGravity = false;

        // Plataforma elevadiza vertical ampliada a 100x44 px
        plat.setDisplaySize(100, 44);

        if (plat.scaleX === 1) {
            plat.body.setSize(92, 18);
            plat.body.setOffset(4, 3);
        } else {
            plat.body.setSize(92 / plat.scaleX, 18 / plat.scaleY);
            plat.body.setOffset(4 / plat.scaleX, 3 / plat.scaleY);
        }

        plat.body.checkCollision.down = false;
        plat.body.checkCollision.left = false;
        plat.body.checkCollision.right = false;
        plat.body.checkCollision.up = true;

        plat.minY = minY;
        plat.maxY = maxY;
        plat.velocidadBase = velocidad;
        plat.body.setVelocityY(velocidad);
        plat.tipoMovimiento = 'vertical';

        this.listaPlataformasMoviles.push(plat);
        return plat;
    }

    /* =========================================================================
     * JUGADOR Y ARNES/MOCHILA DE CABLE
     * ========================================================================= */
    crearJugador() {
        // Posición de inicio sobre el acantilado izquierdo
        this.puntoSpawn = { x: 100, y: 500 };

        this.jugador = this.physics.add.sprite(this.puntoSpawn.x, this.puntoSpawn.y, `avatar-${this.avatarKey}`);
        this.jugador.setDisplaySize(58, 58);
        this.jugador.setDepth(7);
        this.jugador.setCollideWorldBounds(true);

        // Físicas de salto tipo plataformas
        this.jugador.body.setGravityY(980);
        this.jugador.body.setSize(30, 48);
        this.jugador.body.setOffset(17, 14);

        // Mochila / Arnés de transporte de cable (dibujado en tiempo real sobre el avatar)
        this.mochilaCable = this.add.graphics().setDepth(7.5);

        // Estado del jugador
        this.jugadorEnPlataforma = null;
        this.mirandoDerecha = true;
    }

    /* =========================================================================
     * COLISIONES Y CONTACTOS
     * ========================================================================= */
    configurarColisiones() {
        // Colisión del jugador con plataformas estáticas
        this.physics.add.collider(this.jugador, this.plataformasEstaticas, () => {
            this.jugadorEnPlataforma = null;
        });

        // Colisión del jugador con plataformas móviles (sincronizar velocidad del piso)
        this.physics.add.collider(this.jugador, this.plataformasMoviles, (jugador, plat) => {
            if (jugador.body.touching.down && plat.body.touching.up) {
                this.jugadorEnPlataforma = plat;
            }
        });

        // Conexión del cable con la terminal de energía solar
        this.physics.add.overlap(this.jugador, this.zonaConexionTerminal, () => {
            if (!this.cableConectado && !this.juegoTerminado) {
                this.conectarCableExitoso();
            }
        });
    }

    /* =========================================================================
     * ENEMIGOS - NUBES PATRULLEROS (ESPECTROS DE TORMENTA)
     * ========================================================================= */
    crearEnemigos() {
        this.grupoEspectros = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // Espectro 1: Patrullando sobre el primer abismo (entre plataforma 1 y 2)
        // Rango ampliado: de 100 px a ~190 px
        this.crearEspectro(350, 430, 255, 445, 45, 12);

        // Espectro 2: Patrullando en la zona media (entre plataforma 3 y 4)
        // Rango ampliado: de 120 px a ~220 px
        this.crearEspectro(690, 370, 580, 800, 55, 16);

        // Espectro 3: Patrullando en la zona final (entre plataforma 5 y 6)
        // Rango ampliado: de 120 px a ~220 px
        this.crearEspectro(1040, 430, 930, 1150, 50, 14);

        // Colisión / impacto con el jugador
        this.physics.add.overlap(this.jugador, this.grupoEspectros, (jugador, espectro) => {
            if (!this.invulnerable && !this.juegoTerminado) {
                this.recibirDanoPorImpacto(espectro);
            }
        });
    }

    crearEspectro(x, y, minX, maxX, velocidad, amplitudBobbing) {
        const espectro = this.grupoEspectros.create(x, y, 'espectro_tormenta');
        espectro.setDisplaySize(48, 44);
        espectro.setDepth(6);
        espectro.body.setSize(34, 30);
        espectro.body.setOffset(7, 7);

        espectro.baseY = y;
        espectro.minX = minX;
        espectro.maxX = maxX;
        espectro.velocidadX = velocidad;
        espectro.amplitud = amplitudBobbing;
        espectro.fase = Phaser.Math.FloatBetween(0, Math.PI * 2);

        // Destello pulsante sutil en los ojos
        this.tweens.add({
            targets: espectro,
            scaleX: { from: 1, to: 1.08 },
            scaleY: { from: 1, to: 0.94 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        return espectro;
    }

    /* =========================================================================
     * COLECCIONABLES DE ENERGÍA (ORBES LIMPIOS)
     * ========================================================================= */
    crearColeccionables() {
        this.grupoOrbes = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });

        // Orbes colocados en rutas aéreas sobre las plataformas a lo largo del cañón extendido
        const posicionesOrbes = [
            { x: 340, y: 550 },
            { x: 515, y: 440 },
            { x: 780, y: 350 },
            { x: 960, y: 440 },
            { x: 1120, y: 390 },
            { x: 1245, y: 420 }
        ];

        posicionesOrbes.forEach((pos) => {
            const orbe = this.grupoOrbes.create(pos.x, pos.y, 'orbe_energia');
            orbe.setDisplaySize(24, 24);
            orbe.setDepth(5);
            orbe.body.setCircle(10, 2, 2);

            // Flotación brillante
            this.tweens.add({
                targets: orbe,
                y: pos.y - 8,
                duration: 900,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        });

        this.physics.add.overlap(this.jugador, this.grupoOrbes, (jugador, orbe) => {
            this.recogerOrbe(orbe);
        });
    }

    recogerOrbe(orbe) {
        this.reproducirSonido('recoger');
        this.puntuacion += 150;
        this.actualizarHUD();

        // Texto flotante de puntuación
        this.mostrarTextoFlotante(orbe.x, orbe.y - 15, '+150 ⚡', '#00f2fe');

        // Partículas de chispa al recoger
        for (let i = 0; i < 6; i++) {
            const p = this.add.image(orbe.x, orbe.y, 'chispa_cable').setDisplaySize(8, 8).setDepth(10);
            this.tweens.add({
                targets: p,
                x: p.x + Phaser.Math.Between(-25, 25),
                y: p.y + Phaser.Math.Between(-25, 25),
                alpha: 0,
                scale: 0.2,
                duration: 350,
                onComplete: () => p.destroy()
            });
        }

        orbe.destroy();
    }

    /* =========================================================================
     * HUD RETRO ARCADE (Monitor CRT, Cable FT, Distancia %, Vidas, Tiempo)
     * ========================================================================= */
    crearHUDArcade() {
        this.hudContainer = this.add.container(0, 0).setDepth(20).setScrollFactor(0);

        // Barra superior negra con borde dorado brillante (idéntica al boceto)
        const barraSuperior = this.add.graphics();
        barraSuperior.fillStyle(0x000000, 0.95);
        barraSuperior.fillRect(0, 0, 1000, 52);
        barraSuperior.lineStyle(3, 0xf1c40f, 1);
        barraSuperior.strokeLineShape(new Phaser.Geom.Line(0, 52, 1000, 52));
        this.hudContainer.add(barraSuperior);

        // 1. SCORE
        this.textoScore = this.add.text(25, 18, 'SCORE: 000000', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff'
        });
        this.hudContainer.add(this.textoScore);

        // 2. LIVES (con corazones rojos ❤️)
        this.textoVidas = this.add.text(320, 18, 'LIVES: 3 ❤️❤️❤️', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ff4757'
        });
        this.hudContainer.add(this.textoVidas);

        // 3. CABLE LONGITUD (en Pies / FT)
        this.textoCable = this.add.text(580, 18, 'CABLE: 000 FT', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        });
        this.hudContainer.add(this.textoCable);

        // 4. TIEMPO RESTANTE (Reloj cronómetro)
        this.textoTiempo = this.add.text(860, 18, '⏱ 00:45', {
            fontSize: '15px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#00f2fe'
        });
        this.hudContainer.add(this.textoTiempo);

        // -------------------------------------------------------------
        // Barra Inferior Derecha: DISTANCE: XX% con Mini-Corredor
        // -------------------------------------------------------------
        this.contenedorProgreso = this.add.container(770, 720).setDepth(20).setScrollFactor(0);

        this.textoDistancia = this.add.text(0, -22, 'DISTANCE: 0%', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        });

        // Marco de la barra de progreso
        const marcoBarra = this.add.graphics();
        marcoBarra.fillStyle(0x0a101d, 0.9);
        marcoBarra.fillRoundedRect(0, 0, 195, 24, 6);
        marcoBarra.lineStyle(3, 0xffffff, 1);
        marcoBarra.strokeRoundedRect(0, 0, 195, 24, 6);

        // Relleno celeste de progreso
        this.graficoBarraProgreso = this.add.graphics();

        // Icono de mini corredor animado en la barra
        this.iconoCorredor = this.add.text(5, 3, '🏃', {
            fontSize: '14px'
        });

        this.contenedorProgreso.add([this.textoDistancia, marcoBarra, this.graficoBarraProgreso, this.iconoCorredor]);

        // Marco retro sutil que simula la pantalla CRT con esquinas redondeadas del boceto
        const marcoCRT = this.add.graphics().setDepth(25);
        marcoCRT.lineStyle(8, 0x111111, 0.9);
        marcoCRT.strokeRoundedRect(4, 4, 992, 792, 16);
        this.hudContainer.add(marcoCRT);

        // Botón superior de SALIR / MENÚ
        const btnSalir = this.add.text(980, 26, '✖', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fill: '#ff6b81'
        }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

        btnSalir.on('pointerdown', () => this.volverAlOrigen());
        this.hudContainer.add(btnSalir);
    }

    actualizarHUD() {
        // Formato de Score con ceros a la izquierda
        this.textoScore.setText(`SCORE: ${this.puntuacion.toString().padStart(6, '0')}`);

        // Vidas en corazones
        const corazones = '❤️'.repeat(Math.max(0, this.vidas));
        this.textoVidas.setText(`LIVES: ${this.vidas} ${corazones}`);

        // Cable en pies
        this.textoCable.setText(`CABLE: ${Math.round(this.longitudCableFT).toString().padStart(3, '0')} FT`);

        // Tiempo en formato MM:SS
        const minutos = Math.floor(this.tiempoRestante / 60);
        const segundos = this.tiempoRestante % 60;
        this.textoTiempo.setText(`⏱ ${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`);

        // Barra de progreso y porcentaje de distancia hacia la meta solar
        const progreso = Phaser.Math.Clamp(this.distanciaPorcentaje, 0, 1);
        this.textoDistancia.setText(`DISTANCE: ${Math.round(progreso * 100)}%`);

        this.graficoBarraProgreso.clear();
        this.graficoBarraProgreso.fillStyle(0x00f2fe, 1);
        const anchoLleno = (195 - 6) * progreso;
        if (anchoLleno > 4) {
            this.graficoBarraProgreso.fillRoundedRect(3, 3, anchoLleno, 18, 4);
        }

        // Posicionar el mini corredor en la punta de la barra
        this.iconoCorredor.x = Phaser.Math.Clamp(anchoLleno - 12, 3, 175);
    }

    /* =========================================================================
     * FÍSICAS Y DIBUJADO DINÁMICO DEL CABLE ELÉCTRICO
     * ========================================================================= */
    actualizarCableDinamico() {
        this.graficosCable.clear();

        // Origen del cable en la boquilla del generador izquierdo
        const origX = this.posicionSalidaCable.x;
        const origY = this.posicionSalidaCable.y;

        // Destino del cable en la mochila/espalda del jugador (o terminal si ya se conectó)
        let destX, destY;
        if (this.cableConectado) {
            destX = this.posicionEnchufeMeta.x;
            destY = this.posicionEnchufeMeta.y;
        } else {
            destX = this.jugador.x + (this.mirandoDerecha ? -14 : 14);
            destY = this.jugador.y - 4;
        }

        // Calcular distancia y catenaria (caída natural del cable por gravedad)
        const dx = destX - origX;
        const dy = destY - origY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Convertir la distancia en píxeles a unidades FT para el HUD retro
        this.longitudCableFT = (dist / 1280) * 115;

        // Curvatura del cable: cuelga más cuando está cerca, se tensa cuando el jugador salta o se aleja
        const mitadX = (origX + destX) / 2;
        const caidaGravedad = Phaser.Math.Clamp(dist * 0.12, 10, 45);
        const mitadY = (origY + destY) / 2 + caidaGravedad;

        // 1. Línea exterior oscura de contorno (estilo arcade pixel art)
        this.graficosCable.lineStyle(6, 0x1e272e, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 2. Línea principal amarilla de cable de alta tensión
        this.graficosCable.lineStyle(3.5, 0xf1c40f, 1);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY, destX, destY);

        // 3. Brillo neón interno
        this.graficosCable.lineStyle(1.5, 0xffffff, 0.9);
        this.dibujarCurvaCable(origX, origY, mitadX, mitadY - 1, destX, destY);

        // Dibujar mochila / arnés porta-cable sobre la espalda del jugador
        if (!this.cableConectado && this.jugador.active) {
            this.mochilaCable.clear();
            const mochX = this.jugador.x + (this.mirandoDerecha ? -16 : 6);
            const mochY = this.jugador.y - 12;

            // Mochila verde de explorador con refuerzos
            this.mochilaCable.fillStyle(0x27ae60, 1);
            this.mochilaCable.fillRoundedRect(mochX, mochY, 12, 20, 3);
            this.mochilaCable.lineStyle(1.5, 0x1e272e, 1);
            this.mochilaCable.strokeRoundedRect(mochX, mochY, 12, 20, 3);

            // Batería / conector amarillo en la mochila
            this.mochilaCable.fillStyle(0xf1c40f, 1);
            this.mochilaCable.fillRect(mochX + 2, mochY + 4, 8, 5);
        } else {
            this.mochilaCable.clear();
        }
    }

    dibujarCurvaCable(x0, y0, cx, cy, x1, y1) {
        const curva = new Phaser.Curves.QuadraticBezier(
            new Phaser.Math.Vector2(x0, y0),
            new Phaser.Math.Vector2(cx, cy),
            new Phaser.Math.Vector2(x1, y1)
        );
        curva.draw(this.graficosCable);
    }

    /* =========================================================================
     * CONTROLES Y MOVIMIENTO DEL JUGADOR
     * ========================================================================= */
    configurarControles() {
        this.cursores = this.input.keyboard.createCursorKeys();
        this.teclaW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaESPACIO = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaENTER = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);

        this.teclaESC.on('down', () => this.volverAlOrigen());
        this.teclaENTER.on('down', () => {
            if (this.nivelCompletado && this.modalVictoria && this.modalVictoria.visible) {
                this.irANivel2();
            } else if (this.juegoTerminado && this.modalGameOver && this.modalGameOver.visible) {
                this.reiniciarNivel();
            }
        });
    }

    actualizarJugador() {
        if (this.juegoTerminado || this.nivelCompletado) return;

        const velocidadX = 220;
        const fuerzaSalto = -560;

        // Entradas de teclado y cruceta táctil en pantalla
        const moverIzq = this.cursores.left.isDown || this.teclaA.isDown || window.mobileControls?.isDown('left');
        const moverDer = this.cursores.right.isDown || this.teclaD.isDown || window.mobileControls?.isDown('right');
        const intentarSalto = Phaser.Input.Keyboard.JustDown(this.cursores.up) ||
            Phaser.Input.Keyboard.JustDown(this.teclaW) ||
            Phaser.Input.Keyboard.JustDown(this.teclaESPACIO) ||
            window.mobileControls?.consume('up');

        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        if (!enSuelo) {
            this.jugadorEnPlataforma = null;
        }

        // Movimiento Horizontal
        if (moverIzq) {
            this.jugador.setVelocityX(-velocidadX);
            this.mirandoDerecha = false;
            this.jugador.setFlipX(!enSuelo);
            if (enSuelo) {
                this.jugador.play(`avatar-${this.avatarKey}-correr-izq`, true);
            }
        } else if (moverDer) {
            this.jugador.setVelocityX(velocidadX);
            this.mirandoDerecha = true;
            this.jugador.setFlipX(false);
            if (enSuelo) {
                this.jugador.play(`avatar-${this.avatarKey}-correr-der`, true);
            }
        } else {
            // Inercia de plataforma móvil si está apoyado en ella
            if (this.jugadorEnPlataforma && this.jugadorEnPlataforma.body) {
                this.jugador.setVelocityX(this.jugadorEnPlataforma.body.velocity.x);
            } else {
                this.jugador.setVelocityX(0);
            }

            if (enSuelo) {
                this.jugador.setFlipX(false);
                this.jugador.play(`avatar-${this.avatarKey}-quieto`, true);
            }
        }

        // Salto
        if (intentarSalto && enSuelo) {
            this.jugador.setVelocityY(fuerzaSalto);
            this.jugador.setFlipX(!this.mirandoDerecha);
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
            this.reproducirSonido('salto');
            this.crearPolvoSalto(this.jugador.x, this.jugador.y + 24);
        }

        // Animar caída en el aire
        if (!enSuelo && this.jugador.body.velocity.y > 0) {
            this.jugador.setFlipX(!this.mirandoDerecha);
            this.jugador.play(`avatar-${this.avatarKey}-salto`, true);
        }

        // Si el jugador cae al abismo del cañón (fondo de la pantalla)
        if (this.jugador.y > 760) {
            this.caerAlAbismo();
        }

        // Calcular porcentaje de distancia hacia la meta solar
        const progreso = (this.jugador.x - 100) / (this.posicionEnchufeMeta.x - 100);
        this.distanciaPorcentaje = Phaser.Math.Clamp(progreso, 0, 1);
    }

    crearPolvoSalto(x, y) {
        for (let i = 0; i < 3; i++) {
            const p = this.add.circle(x + Phaser.Math.Between(-10, 10), y, Phaser.Math.FloatBetween(2, 4), 0xf1f2f6, 0.7).setDepth(6);
            this.tweens.add({
                targets: p,
                y: y - 10,
                alpha: 0,
                scale: 1.5,
                duration: 250,
                onComplete: () => p.destroy()
            });
        }
    }

    /* =========================================================================
     * MOVIMIENTO DE PLATAFORMAS Y ENEMIGOS
     * ========================================================================= */
    actualizarPlataformasYEnemigos() {
        // 1. Plataformas móviles horizontales y verticales
        this.listaPlataformasMoviles.forEach((plat) => {
            if (plat.tipoMovimiento === 'horizontal') {
                if (plat.x >= plat.maxX && plat.body.velocity.x > 0) {
                    plat.body.setVelocityX(-plat.velocidadBase);
                } else if (plat.x <= plat.minX && plat.body.velocity.x < 0) {
                    plat.body.setVelocityX(plat.velocidadBase);
                }
            } else if (plat.tipoMovimiento === 'vertical') {
                if (plat.y >= plat.maxY && plat.body.velocity.y > 0) {
                    plat.body.setVelocityY(-plat.velocidadBase);
                } else if (plat.y <= plat.minY && plat.body.velocity.y < 0) {
                    plat.body.setVelocityY(plat.velocidadBase);
                }
            }
        });

        // 2. Espectros de tormenta patrullando en el aire
        const tiempo = this.time.now * 0.003;
        this.grupoEspectros.getChildren().forEach((esp) => {
            if (esp.active) {
                // Movimiento horizontal entre límites
                esp.x += esp.velocidadX * 0.016;
                if (esp.x >= esp.maxX && esp.velocidadX > 0) {
                    esp.velocidadX = -Math.abs(esp.velocidadX);
                    esp.setFlipX(true);
                } else if (esp.x <= esp.minX && esp.velocidadX < 0) {
                    esp.velocidadX = Math.abs(esp.velocidadX);
                    esp.setFlipX(false);
                }

                // Oscilación sinusoidal vertical (vuelo suspendido)
                esp.y = esp.baseY + Math.sin(tiempo + esp.fase) * esp.amplitud;
            }
        });

        // 3. Nubes decorativas de fondo
        this.nubesLejanas.forEach((nube) => {
            nube.x -= nube.velocidad;
            if (nube.x < -60) {
                nube.x = this.anchoMundo + 60;
                nube.y = Phaser.Math.Between(70, 220);
            }
        });
    }

    /* =========================================================================
     * DAÑO, CAÍDAS Y RESPAWN
     * ========================================================================= */
    recibirDanoPorImpacto(espectro) {
        if (this.nivelCompletado || this.juegoTerminado || this.invulnerable) return;

        this.vidas--;
        this.reproducirSonido('dano');
        this.actualizarHUD();

        // Empuje de retroceso
        const dirEmpuje = this.jugador.x < espectro.x ? -180 : 180;
        this.jugador.setVelocity(dirEmpuje, -300);

        // Agitar cámara ligeramente
        this.cameras.main.shake(180, 0.007);
        this.mostrarTextoFlotante(this.jugador.x, this.jugador.y - 25, '¡ZAP! -1 VIDA', '#ff4757');

        // Efecto de parpadeo de invulnerabilidad
        this.invulnerable = true;
        this.tweens.add({
            targets: this.jugador,
            alpha: { from: 0.2, to: 1 },
            duration: 100,
            yoyo: true,
            repeat: 7,
            onComplete: () => {
                this.jugador.setAlpha(1);
                this.invulnerable = false;
            }
        });

        if (this.vidas <= 0) {
            this.declararGameOver('¡Te has quedado sin vidas!');
        }
    }

    caerAlAbismo() {
        if (this.nivelCompletado || this.juegoTerminado) return;

        this.vidas--;
        this.reproducirSonido('caida');
        this.actualizarHUD();

        this.mostrarTextoFlotante(this.jugador.x, 700, '¡CAÍDA AL ABISMO! -1 VIDA', '#ff4757');
        this.cameras.main.flash(200, 255, 71, 87);

        if (this.vidas <= 0) {
            this.declararGameOver('¡Caíste al cañón sin vidas!');
        } else {
            // Respawn en el acantilado izquierdo
            this.jugador.setPosition(this.puntoSpawn.x, this.puntoSpawn.y);
            this.jugador.setVelocity(0, 0);

            // Invulnerabilidad temporal
            this.invulnerable = true;
            this.tweens.add({
                targets: this.jugador,
                alpha: { from: 0.3, to: 1 },
                duration: 120,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    this.jugador.setAlpha(1);
                    this.invulnerable = false;
                }
            });
        }
    }

    /* =========================================================================
     * CONEXIÓN EXITOSA DEL CABLE (VICTORIA NIVEL 1)
     * ========================================================================= */
    conectarCableExitoso() {
        if (this.cableConectado) return;
        this.cableConectado = true;
        this.nivelCompletado = true;
        this.marcadorMeta.setVisible(false);

        // Desactivar completamente físicas y gravedad para que el jugador nunca caiga al ganar
        this.jugador.setVelocity(0, 0);
        if (this.jugador.body) {
            this.jugador.body.setVelocity(0, 0);
            this.jugador.body.setAcceleration(0, 0);
            this.jugador.body.allowGravity = false;
            this.jugador.body.moves = false;
            this.jugador.body.enable = false;
        }

        // Posicionar firmemente al jugador de pie sobre el césped del acantilado derecho frente a la estación solar (a 25px seguros del borde)
        this.jugador.setPosition(1355, 516);
        this.jugador.setFlipX(false);
        this.mirandoDerecha = true;
        this.jugador.play(`avatar-${this.avatarKey}-quieto`);

        // Animación suave de celebración (saltito festivo en el lugar sin físicas)
        this.tweens.add({
            targets: this.jugador,
            y: 504,
            duration: 220,
            yoyo: true,
            repeat: 2,
            ease: 'Sine.easeOut'
        });

        // Sonido triunfal de conexión limpia
        this.reproducirSonido('conexion_exitosa');

        // Efecto visual de chispas y relámpago verde/dorado de energía
        this.crearExplosionDeEnergiaLimpia(this.posicionEnchufeMeta.x, this.posicionEnchufeMeta.y);

        // Bonificación de tiempo y cable
        const bonusTiempo = this.tiempoRestante * 50;
        const bonusCable = Math.round(this.longitudCableFT) * 10;
        const bonusNivel = 1000;
        this.puntuacion += bonusNivel + bonusTiempo + bonusCable;
        this.actualizarHUD();

        // Mostrar Modal de Victoria tras breve animación
        this.time.delayedCall(1200, () => {
            this.mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable);
        });
    }

    crearExplosionDeEnergiaLimpia(x, y) {
        // Destello en la terminal solar
        for (let i = 0; i < 24; i++) {
            const p = this.add.image(x, y, 'chispa_cable').setDepth(15);
            const angulo = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(30, 90);

            this.tweens.add({
                targets: p,
                x: x + Math.cos(angulo) * dist,
                y: y + Math.sin(angulo) * dist,
                scale: { from: 1.5, to: 0 },
                alpha: { from: 1, to: 0 },
                duration: Phaser.Math.Between(500, 800),
                ease: 'Cubic.easeOut',
                onComplete: () => p.destroy()
            });
        }

        // Rayo de luz hacia el cielo
        const hazLuz = this.add.graphics().setDepth(14);
        hazLuz.fillStyle(0x00f2fe, 0.4);
        hazLuz.fillRect(x - 15, 0, 30, y);
        this.tweens.add({
            targets: hazLuz,
            alpha: 0,
            duration: 900,
            onComplete: () => hazLuz.destroy()
        });
    }

    /* =========================================================================
     * TEMPORIZADOR DE JUEGO
     * ========================================================================= */
    iniciarTemporizador() {
        this.relojEvento = this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (!this.juegoTerminado && !this.nivelCompletado && !this.juegoPausado) {
                    this.tiempoRestante--;
                    this.actualizarHUD();

                    if (this.tiempoRestante <= 0) {
                        this.declararGameOver('¡Se agotó el tiempo de suministro!');
                    }
                }
            },
            loop: true
        });
    }

    /* =========================================================================
     * MODALES DE VICTORIA Y GAME OVER
     * ========================================================================= */
    crearModalesFinDeJuego() {
        // -------------------------------------------------------------
        // Modal de Victoria — visual en container (scrollFactor 0)
        // -------------------------------------------------------------
        this.modalVictoria = this.add.container(500, 400).setDepth(30).setVisible(false).setAlpha(0).setScrollFactor(0);

        const telonV = this.add.graphics();
        telonV.fillStyle(0x000000, 0.75);
        telonV.fillRect(-500, -400, 1000, 800);

        const cardV = this.add.graphics();
        cardV.fillStyle(0x0c2461, 0.98);
        cardV.fillRoundedRect(-300, -210, 600, 420, 18);
        cardV.lineStyle(4, 0x00f2fe, 1);
        cardV.strokeRoundedRect(-300, -210, 600, 420, 18);

        const tituloV = this.add.text(0, -165, '★ ¡ENERGÍA CONECTADA! ★', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        const subV = this.add.text(0, -130, 'Nivel 1: Cañón de Paneles Solares Superado', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#7ed6df'
        }).setOrigin(0.5);

        this.textoDetalleVictoria = this.add.text(0, -20, '', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 14
        }).setOrigin(0.5);

        this.modalVictoria.add([telonV, cardV, tituloV, subV, this.textoDetalleVictoria]);

        // Botones de victoria — GameObjects independientes con setScrollFactor(0)
        // para que el input del puntero funcione aunque la cámara haya hecho scroll.
        // El container visual está en (500,400); coordenadas absolutas = 500+dx, 400+dy
        this.botonesVictoria = [
            this.crearBotonModalAbs(290, 540, 'REINTENTAR', 0xe67e22, () => this.reiniciarNivel(), 165),
            this.crearBotonModalAbs(500, 540, 'NIVEL 2 ➔', 0x0984e3, () => this.irANivel2(), 170),
            this.crearBotonModalAbs(710, 540, 'SALIR', 0x27ae60, () => this.volverAlOrigen(), 165)
        ];

        // -------------------------------------------------------------
        // Modal de Game Over — mismo patrón
        // -------------------------------------------------------------
        this.modalGameOver = this.add.container(500, 400).setDepth(30).setVisible(false).setAlpha(0).setScrollFactor(0);

        const telonGO = this.add.graphics();
        telonGO.fillStyle(0x000000, 0.82);
        telonGO.fillRect(-500, -400, 1000, 800);

        const cardGO = this.add.graphics();
        cardGO.fillStyle(0x2c0b0e, 0.98);
        cardGO.fillRoundedRect(-280, -180, 560, 360, 18);
        cardGO.lineStyle(4, 0xff4757, 1);
        cardGO.strokeRoundedRect(-280, -180, 560, 360, 18);

        const tituloGO = this.add.text(0, -130, '💀 CABLE DESCONECTADO 💀', {
            fontSize: '18px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ff4757'
        }).setOrigin(0.5);

        this.textoCausaGameOver = this.add.text(0, -70, '', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#ff6b81',
            align: 'center'
        }).setOrigin(0.5);

        this.textoScoreGameOver = this.add.text(0, -10, '', {
            fontSize: '14px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#f1c40f'
        }).setOrigin(0.5);

        this.modalGameOver.add([telonGO, cardGO, tituloGO, this.textoCausaGameOver, this.textoScoreGameOver]);

        // Botones de game over — GameObjects independientes con setScrollFactor(0)
        this.botonesGameOver = [
            this.crearBotonModalAbs(380, 510, 'REINTENTAR', 0xe74c3c, () => this.reiniciarNivel()),
            this.crearBotonModalAbs(620, 510, 'SALIR', 0x747d8c, () => this.volverAlOrigen())
        ];
    }

    /**
     * Crea un botón interactivo como GameObjects de primer nivel (NO dentro de container)
     * con setScrollFactor(0), para que el input se calcule en coordenadas de pantalla
     * independientemente de cuánto haya scrolleado la cámara.
     * @param {number} absX  Coordenada X absoluta en pantalla (viewport)
     * @param {number} absY  Coordenada Y absoluta en pantalla (viewport)
     */
    crearBotonModalAbs(absX, absY, texto, colorHex, accion, anchoCustom) {
        const W = anchoCustom || 200, H = 40;

        // Fondo del botón
        const bg = this.add.graphics()
            .setScrollFactor(0).setDepth(31).setAlpha(0).setVisible(true);
        const dibujarBg = (escala) => {
            bg.clear();
            const w = W * escala, h = H * escala;
            bg.fillStyle(colorHex, 1);
            bg.fillRoundedRect(absX - w / 2, absY - h / 2, w, h, 8);
            bg.lineStyle(2, 0xffffff, 0.8);
            bg.strokeRoundedRect(absX - w / 2, absY - h / 2, w, h, 8);
        };
        dibujarBg(1);

        // Texto del botón
        const txt = this.add.text(absX, absY, texto, {
            fontSize: '12px',
            fontFamily: '"Press Start 2P", monospace',
            fill: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(32).setAlpha(0);

        // Zona de interacción invisible encima
        const zone = this.add.zone(absX, absY, W, H)
            .setScrollFactor(0).setDepth(33);
        zone.setInteractive(new Phaser.Geom.Rectangle(0, 0, W, H), Phaser.Geom.Rectangle.Contains);
        if (zone.input) {
            zone.input.cursor = 'pointer';
        }

        let procesando = false;
        const ejecutarAccion = () => {
            if (procesando) return;
            procesando = true;
            accion();
        };

        zone.on('pointerover', () => { dibujarBg(1.06); txt.setScale(1.06); });
        zone.on('pointerout', () => { dibujarBg(1); txt.setScale(1); });
        zone.on('pointerdown', ejecutarAccion);
        zone.on('pointerup', ejecutarAccion);

        // Hacer también el texto interactivo para garantizar respuesta táctil
        txt.setInteractive({ useHandCursor: true });
        txt.on('pointerdown', ejecutarAccion);
        txt.on('pointerup', ejecutarAccion);

        // Devuelve los tres objetos para poder mostrarlos/ocultarlos juntos
        return { bg, txt, zone };
    }

    /** Muestra u oculta un array de botones creados con crearBotonModalAbs */
    _setBotonesVisible(botones, visible, alpha) {
        for (const b of botones) {
            b.bg.setAlpha(alpha);
            b.txt.setAlpha(alpha);
            if (b.zone && b.zone.input) {
                b.zone.input.enabled = visible;
            }
            if (b.txt && b.txt.input) {
                b.txt.input.enabled = visible;
            }
        }
    }

    mostrarModalVictoria(bonusNivel, bonusTiempo, bonusCable) {
        this.textoDetalleVictoria.setText(
            `NIVEL SUPERADO : +${bonusNivel}\n` +
            `BONO TIEMPO    : +${bonusTiempo}\n` +
            `BONO CABLE     : +${bonusCable}\n\n` +
            `PUNTUACIÓN TOTAL : ${this.puntuacion}`
        );

        this._setBotonesVisible(this.botonesVictoria, false, 0);
        this.modalVictoria.setVisible(true);
        this.tweens.add({
            targets: this.modalVictoria,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this._setBotonesVisible(this.botonesVictoria, true, 1);
            }
        });

        // Transición automática al Nivel 2 tras 5 segundos si el jugador no presiona antes
        if (this.temporizadorAutoNivel2) this.temporizadorAutoNivel2.remove();
        this.temporizadorAutoNivel2 = this.time.delayedCall(5000, () => {
            if (this.nivelCompletado && !this.cambiandoNivel) {
                this.irANivel2();
            }
        });
    }

    declararGameOver(causa) {
        if (this.juegoTerminado) return;
        this.juegoTerminado = true;
        this.reproducirSonido('game_over');

        this.textoCausaGameOver.setText(causa);
        this.textoScoreGameOver.setText(`SCORE FINAL: ${this.puntuacion}`);

        this._setBotonesVisible(this.botonesGameOver, false, 0);
        this.modalGameOver.setVisible(true);
        this.tweens.add({
            targets: this.modalGameOver,
            alpha: 1,
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => this._setBotonesVisible(this.botonesGameOver, true, 1)
        });
    }

    reiniciarNivel() {
        if (this.temporizadorAutoNivel2) this.temporizadorAutoNivel2.remove();
        this.scene.restart();
    }

    irANivel2() {
        if (this.cambiandoNivel) return;
        this.cambiandoNivel = true;
        if (this.temporizadorAutoNivel2) this.temporizadorAutoNivel2.remove();
        const avatar = this.avatarKey || localStorage.getItem('muchbits-avatar') || 'user_male';
        this.scene.stop('EscenaSustentable');
        this.scene.start('EscenaSustentable2', {
            origen: this.origen || 'EscenaMenu',
            avatarKey: avatar
        });
    }

    volverAlOrigen() {
        if (this.temporizadorAutoNivel2) this.temporizadorAutoNivel2.remove();
        if (this.origen === 'EscenaMenu') {
            this.scene.start('EscenaMenu');
        } else {
            this.scene.start('EscenaJuego', {
                posInicial: { x: 820, y: 510 },
                avatarKey: this.avatarKey
            });
        }
    }

    mostrarTextoFlotante(x, y, mensaje, colorHex) {
        const txt = this.add.text(x, y, mensaje, {
            fontSize: '13px',
            fontFamily: '"Press Start 2P", monospace',
            fill: colorHex,
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(25);

        this.tweens.add({
            targets: txt,
            y: y - 35,
            alpha: 0,
            duration: 850,
            ease: 'Cubic.easeOut',
            onComplete: () => txt.destroy()
        });
    }

    /* =========================================================================
     * BUCLE PRINCIPAL (UPDATE)
     * ========================================================================= */
    update(time, delta) {
        // 1. Movimiento y físicas del jugador
        this.actualizarJugador();

        // 2. Trazado del cable eléctrico dinámico
        this.actualizarCableDinamico();

        // 3. Plataformas móviles y espectros de viento
        this.actualizarPlataformasYEnemigos();

        // 4. Actualización del HUD
        this.actualizarHUD();

        // 5. Interacción móvil para modales (Enter / Escape)
        if (window.mobileControls) {
            if (this.nivelCompletado && this.modalVictoria && this.modalVictoria.visible) {
                if (window.mobileControls.consume('enter')) {
                    this.irANivel2();
                } else if (window.mobileControls.consume('escape')) {
                    this.volverAlOrigen();
                }
            } else if (this.juegoTerminado && this.modalGameOver && this.modalGameOver.visible) {
                if (window.mobileControls.consume('enter')) {
                    this.reiniciarNivel();
                } else if (window.mobileControls.consume('escape')) {
                    this.volverAlOrigen();
                }
            }
        }
    }

    /* =========================================================================
     * SINTETIZADOR DE AUDIO PROCEDURAL (Web Audio API)
     * ========================================================================= */
    initAudioSynthesizer() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    reproducirSonido(tipo) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }

        const ctx = this.audioCtx;
        const now = ctx.currentTime;

        if (tipo === 'salto') {
            // Salto elástico arcade
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(440, now + 0.12);

            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.12);
        } else if (tipo === 'recoger') {
            // Chime brillante de orbe de energía
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(587.33, now); // D5
            osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15); // D6

            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
        } else if (tipo === 'dano') {
            // Golpe eléctrico estridente
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(260, now);
            osc.frequency.exponentialRampToValueAtTime(60, now + 0.22);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        } else if (tipo === 'caida') {
            // Silbido de caída descendente
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.exponentialRampToValueAtTime(80, now + 0.35);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (tipo === 'conexion_exitosa') {
            // Fanfarria triunfal de energía limpia
            [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.09;
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.22, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.25);
            });
        } else if (tipo === 'game_over') {
            // Melodía triste descendente
            [392.00, 369.99, 329.63, 293.66].forEach((freq, idx) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const t = now + idx * 0.15;
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, t);

                gain.gain.setValueAtTime(0.18, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(t);
                osc.stop(t + 0.22);
            });
        }
    }
}
