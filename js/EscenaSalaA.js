/**
 * EscenaSalaA.js - Expedición Chiapas: Selva Lacandona y Bosque de Niebla
 * Mapeo completo de Spritesheets para Fauna y Flora con Animaciones 2D
 */
class EscenaSalaA extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSalaA' });
    }

    init(data) {
        this.avatarKey = data && data.avatarKey ? data.avatarKey : (localStorage.getItem('muchbits-avatar') || 'user_default');
        this.origen = data && data.origen ? data.origen : 'EscenaJuego';
        this.bitacora = {
            quetzal: {
                id: 'quetzal',
                tipo: 'fauna',
                nombre: 'Quetzal Mesoamericano',
                cientifico: 'Pharomachrus mocinno',
                habitat: 'Bosque de Niebla (El Triunfo)',
                estado: 'Casi amenazado / Protegido',
                desc: 'Ave sagrada maya de plumaje verde esmeralda brillante y largas timoneras. Dispersa semillas de aguacatillo en las cumbres montañosas.',
                registrada: false,
                fotoLegendaria: false,
                texturaKey: 'quetzal_volando_raw',
                frameKey: 'perch_wings_open'
            },
            tapir: {
                id: 'tapir',
                tipo: 'fauna',
                nombre: 'Tapir Centroamericano',
                cientifico: 'Tapirus bairdii',
                habitat: 'Selva Lacandona y humedales',
                estado: 'En peligro de extinción',
                desc: 'El mamífero terrestre más grande del Neotrópico. Gran dispersor de semillas, conocido como el "arquitecto de los bosques tropicales".',
                registrada: false,
                texturaKey: 'tapir_sheet',
                frameKey: 0
            },
            mono: {
                id: 'mono',
                tipo: 'fauna',
                nombre: 'Mono Saraguato (Aullador)',
                cientifico: 'Alouatta pigra',
                habitat: 'Dosel de selvas altas perennifolias',
                estado: 'En peligro de extinción',
                desc: 'Posee un hueso hioides hipertrofiado que amplifica sus aullidos para marcar territorio y comunicarse entre las copas de los árboles.',
                registrada: false,
                texturaKey: 'mono_img',
                frameKey: null
            },
            pecari: {
                id: 'pecari',
                tipo: 'fauna',
                nombre: 'Pecarí de Labios Blancos',
                cientifico: 'Tayassu pecari',
                habitat: 'Suelo de selvas tropicales densas',
                estado: 'Vulnerable / Gregario',
                desc: 'Se desplaza en grandes manadas cooperativas. Tritura semillas leñosas muy duras con sus poderosos molares, estructurando la vegetación.',
                registrada: false,
                texturaKey: 'pecari_sheet',
                frameKey: 0
            },
            jaguar: {
                id: 'jaguar',
                tipo: 'fauna',
                nombre: 'Jaguar (Balam)',
                cientifico: 'Panthera onca',
                habitat: 'Selva Lacandona y Cañón del Sumidero',
                estado: 'En peligro de extinción',
                desc: 'El mayor felino de América. Depredador tope carismático con la mordida más potente en proporción a su peso, vital para el equilibrio ecológico.',
                registrada: false,
                fotoLegendaria: false,
                texturaKey: 'jaguar_raw',
                frameKey: 'sit'
            },
            flora_orquidea: {
                id: 'flora_orquidea',
                tipo: 'flora',
                nombre: 'Orquídea Selva Lacandona',
                cientifico: 'Orchidaceae',
                habitat: 'Corteza y horquetas de Ceibas centenarias',
                estado: 'Protección especial (NOM-059)',
                desc: 'Planta epífita que absorbe agua de la niebla selvática sin parasitar al hospedero. Atrae abejas de las orquídeas altamente especializadas.',
                registrada: false,
                texturaKey: 'flora_strip',
                frameKey: 'orquidea'
            },
            flora_helecho: {
                id: 'flora_helecho',
                tipo: 'flora',
                nombre: 'Helecho Arborescente Fósil',
                cientifico: 'Cyatheales',
                habitat: 'Barrancas sombrías y laderas de niebla',
                estado: 'Reliquia milenaria amenazada',
                desc: 'Verdaderos fósiles vivientes de origen jurásico. Sus troncos retienen toneladas de agua pluvial y regulan el microclima del sotobosque.',
                registrada: false,
                texturaKey: 'flora_strip',
                frameKey: 'helecho'
            }
        };

        this.vidasMax = 3;
        this.vidas = 3;
        this.invulnerable = false;
        this.modalBitacoraAbierto = false;
        this.agachado = false;
        this._transitando = false;
        this.mundoAncho = 4200;
        this.mundoAlto = 800;
        this.sueloY = 660;
    }

    preload() {
        // Avatar del jugador
        if (!this.textures.exists(`avatar-${this.avatarKey}`)) {
            this.load.spritesheet(`avatar-${this.avatarKey}`, `pictures/${this.avatarKey}.png`, {
                frameWidth: 64,
                frameHeight: 64
            });
        }

        // Elementos de entorno
        this.load.image('arbusto', 'pictures/arbusto.png');
        this.load.image('arbol', 'pictures/arbol.png');
        this.load.image('arbol_grande', 'pictures/arbol_grande.png');
        this.load.image('roca', 'pictures/roca.png');

        // Spritesheets de fauna (mapeo directo)
        // 1. Tapir: 1024x1024 -> 4 frames de 512x512 (2 columnas x 2 filas)
        this.load.spritesheet('tapir_sheet', 'pictures/salabiodiversidad/fauna/tapir.png', {
            frameWidth: 512,
            frameHeight: 512
        });

        // 2. Pecarí: 992x1068 -> 6 frames de 496x356 (2 columnas x 3 filas)
        this.load.spritesheet('pecari_sheet', 'pictures/salabiodiversidad/fauna/pecari.png', {
            frameWidth: 496,
            frameHeight: 356
        });

        // 3. Jaguar: 1024x1024 (Se mapea con frames personalizados: 'sit', 'run_0' a 'run_5')
        this.load.image('jaguar_raw', 'pictures/salabiodiversidad/fauna/jaguar.png');

        // 4. Quetzal volando / posado: 837x779 (Se mapea con frames personalizados: 'perch_wings_open', 'perch_wings_folded', 'fly_0' a 'fly_5')
        this.load.image('quetzal_volando_raw', 'pictures/salabiodiversidad/fauna/quetzal-volando.png');

        // 5. Mono: 170x156 (sprite individual)
        this.load.image('mono_img', 'pictures/salabiodiversidad/fauna/mono.png');

        // 6. Flora: 575x65 (tira botánica con múltiples especímenes: orquídea, helecho, bromelia, etc.)
        this.load.image('flora_strip', 'pictures/salabiodiversidad/flora/flora.png');
    }

    create() {
        this._transitando = false;
        this.physics.world.gravity.y = 1100;
        this.physics.world.setBounds(0, 0, this.mundoAncho, this.mundoAlto);

        this._inicializarAudio();
        this._mapearFramesYAnimaciones();
        this._crearFondoParalaje();
        this._crearPlataformasYSuelo();
        this._crearBiodiversidadViva();
        this._crearAnimacionesJugador();
        this._crearJugador();
        this._crearFaunaPacifica();
        this._crearFaunaSalvaje();
        this._crearFloraRecolectable();
        this._crearEstacionFinal();
        this._crearControles();
        this._crearCamara();
        this._crearHUD();
        this._crearModalBitacora();

        this.cameras.main.fadeIn(400, 0, 0, 0);
        this._mostrarNotificacion('🌿 Expedición Chiapas: Spritesheets mapeados con animaciones activas', '#a1e44d', 4500);
    }

    /* -------------------------------------------------------------
     * MAPEO DE SPRITESHEETS Y ANIMACIONES
     * ------------------------------------------------------------- */
    _mapearFramesYAnimaciones() {
        // --- A. MAPEO DE JAGUAR (1024x1024) ---
        const texJaguar = this.textures.get('jaguar_raw');
        if (texJaguar && !texJaguar.has('sit')) {
            // Posición sentada frontal
            texJaguar.add('sit', 0, 16, 58, 185, 293);
            // 6 pasos de carrera
            texJaguar.add('run_0', 0, 220, 60, 380, 295);
            texJaguar.add('run_1', 0, 600, 60, 410, 295);
            texJaguar.add('run_2', 0, 16, 410, 485, 290);
            texJaguar.add('run_3', 0, 516, 410, 490, 290);
            texJaguar.add('run_4', 0, 16, 725, 485, 285);
            texJaguar.add('run_5', 0, 516, 725, 490, 285);
        }

        if (!this.anims.exists('jaguar-correr')) {
            this.anims.create({
                key: 'jaguar-correr',
                frames: [
                    { key: 'jaguar_raw', frame: 'run_0' },
                    { key: 'jaguar_raw', frame: 'run_1' },
                    { key: 'jaguar_raw', frame: 'run_2' },
                    { key: 'jaguar_raw', frame: 'run_3' },
                    { key: 'jaguar_raw', frame: 'run_4' },
                    { key: 'jaguar_raw', frame: 'run_5' }
                ],
                frameRate: 11,
                repeat: -1
            });
        }

        // --- B. MAPEO DE QUETZAL (837x779) ---
        const texQuetzal = this.textures.get('quetzal_volando_raw');
        if (texQuetzal && !texQuetzal.has('perch_wings_open')) {
            // Posado
            texQuetzal.add('perch_wings_open', 0, 0, 32, 260, 245);
            texQuetzal.add('perch_wings_folded', 0, 264, 30, 135, 245);
            // Vuelo
            texQuetzal.add('fly_0', 0, 630, 14, 205, 275);
            texQuetzal.add('fly_1', 0, 45, 320, 185, 345);
            texQuetzal.add('fly_2', 0, 250, 325, 255, 215);
            texQuetzal.add('fly_3', 0, 550, 355, 255, 160);
            texQuetzal.add('fly_4', 0, 505, 545, 310, 185);
            texQuetzal.add('fly_5', 0, 160, 565, 340, 155);
        }

        if (!this.anims.exists('quetzal-posado')) {
            this.anims.create({
                key: 'quetzal-posado',
                frames: [
                    { key: 'quetzal_volando_raw', frame: 'perch_wings_folded' },
                    { key: 'quetzal_volando_raw', frame: 'perch_wings_open' }
                ],
                frameRate: 2,
                repeat: -1
            });
        }

        if (!this.anims.exists('quetzal-vuelo')) {
            this.anims.create({
                key: 'quetzal-vuelo',
                frames: [
                    { key: 'quetzal_volando_raw', frame: 'fly_0' },
                    { key: 'quetzal_volando_raw', frame: 'fly_1' },
                    { key: 'quetzal_volando_raw', frame: 'fly_2' },
                    { key: 'quetzal_volando_raw', frame: 'fly_3' },
                    { key: 'quetzal_volando_raw', frame: 'fly_4' },
                    { key: 'quetzal_volando_raw', frame: 'fly_5' }
                ],
                frameRate: 8,
                repeat: -1
            });
        }

        // --- C. ANIMACIONES DE TAPIR (tapir_sheet: 4 frames) ---
        if (!this.anims.exists('tapir-caminar')) {
            this.anims.create({
                key: 'tapir-caminar',
                frames: this.anims.generateFrameNumbers('tapir_sheet', { start: 0, end: 3 }),
                frameRate: 4,
                repeat: -1
            });
        }
        if (!this.anims.exists('tapir-correr')) {
            this.anims.create({
                key: 'tapir-correr',
                frames: this.anims.generateFrameNumbers('tapir_sheet', { start: 0, end: 3 }),
                frameRate: 11,
                repeat: -1
            });
        }

        // --- D. ANIMACIONES DE PECARÍ (pecari_sheet: 6 frames) ---
        if (!this.anims.exists('pecari-correr')) {
            this.anims.create({
                key: 'pecari-correr',
                frames: this.anims.generateFrameNumbers('pecari_sheet', { start: 0, end: 1 }),
                frameRate: 7,
                repeat: -1
            });
        }

        // --- E. MAPEO DE FLORA STRIP (575x65) ---
        const texFlora = this.textures.get('flora_strip');
        if (texFlora && !texFlora.has('orquidea')) {
            texFlora.add('orquidea', 0, 7, 6, 71, 55);
            texFlora.add('helecho', 0, 93, 14, 50, 47);
            texFlora.add('bromelia', 0, 162, 19, 50, 42);
            texFlora.add('hongo', 0, 345, 32, 34, 29);
            texFlora.add('monstera', 0, 530, 35, 39, 26);
        }
    }

    /* -------------------------------------------------------------
     * AUDIO PROCEDURAL (Web Audio API)
     * ------------------------------------------------------------- */
    _inicializarAudio() {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        } catch (e) {
            this.audioCtx = null;
        }
    }

    _reproducirSonido(tipo) {
        if (!this.audioCtx) return;
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        const now = this.audioCtx.currentTime;

        if (tipo === 'foto') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1300, now);
            osc.frequency.exponentialRampToValueAtTime(320, now + 0.08);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.1);

            const bufSize = this.audioCtx.sampleRate * 0.08;
            const buffer = this.audioCtx.createBuffer(1, bufSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            const nGain = this.audioCtx.createGain();
            nGain.gain.setValueAtTime(0.35, now + 0.04);
            nGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
            noise.connect(nGain);
            nGain.connect(this.audioCtx.destination);
            noise.start(now + 0.04);
        } else if (tipo === 'muestra') {
            const notas = [523.25, 659.25, 783.99, 1046.50];
            notas.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + idx * 0.06);
                gain.gain.setValueAtTime(0.25, now + idx * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(now + idx * 0.06);
                osc.stop(now + idx * 0.06 + 0.35);
            });
        } else if (tipo === 'salto') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.exponentialRampToValueAtTime(540, now + 0.14);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
        } else if (tipo === 'dano') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(140, now);
            osc.frequency.linearRampToValueAtTime(70, now + 0.25);
            gain.gain.setValueAtTime(0.4, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.26);
        } else if (tipo === 'rugido') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(90, now);
            osc.frequency.linearRampToValueAtTime(160, now + 0.2);
            osc.frequency.linearRampToValueAtTime(75, now + 0.55);
            gain.gain.setValueAtTime(0.35, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.65);
        } else if (tipo === 'tapir_alerta') {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(260, now + 0.3);
            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now);
            osc.stop(now + 0.32);
        }
    }

    /* -------------------------------------------------------------
     * PARALAJE MULTICAPA
     * ------------------------------------------------------------- */
    _crearFondoParalaje() {
        // Capa 0: Cielo
        const cielo = this.add.graphics().setScrollFactor(0);
        cielo.fillGradientStyle(0x193328, 0x193328, 0x3d7055, 0x5a9a7a, 1);
        cielo.fillRect(0, 0, 1000, 800);

        // Rayos de luz
        const rayos = this.add.graphics().setScrollFactor(0.02).setAlpha(0.18);
        rayos.fillStyle(0xfff7d6, 1);
        for (let i = 0; i < 7; i++) {
            rayos.fillTriangle(
                120 + i * 160, 0,
                240 + i * 180, 800,
                60 + i * 180, 800
            );
        }

        // Capa 1: Montañas lejanas
        const montanasLejanas = this.add.graphics().setScrollFactor(0.08);
        montanasLejanas.fillStyle(0x1a4030, 0.9);
        const puntosMontanas = [{ x: 0, y: 520 }];
        for (let x = 0; x <= this.mundoAncho + 1000; x += 180) {
            const h = 260 + Math.sin(x * 0.003) * 110 + Math.cos(x * 0.007) * 40;
            puntosMontanas.push({ x: x, y: h });
        }
        puntosMontanas.push({ x: this.mundoAncho + 1000, y: 800 });
        puntosMontanas.push({ x: 0, y: 800 });
        montanasLejanas.fillPoints(puntosMontanas, true);

        // Capa 2: Colinas medias
        const colinasMedias = this.add.graphics().setScrollFactor(0.2);
        colinasMedias.fillStyle(0x1c4d35, 0.95);
        const puntosColinas = [{ x: 0, y: 560 }];
        for (let x = 0; x <= this.mundoAncho + 600; x += 140) {
            const h = 380 + Math.sin(x * 0.004) * 80;
            puntosColinas.push({ x: x, y: h });
        }
        puntosColinas.push({ x: this.mundoAncho + 600, y: 800 });
        puntosColinas.push({ x: 0, y: 800 });
        colinasMedias.fillPoints(puntosColinas, true);

        for (let x = 100; x <= this.mundoAncho; x += 160) {
            const colinaY = 380 + Math.sin(x * 0.004) * 80;
            this.add.image(x, colinaY + 10, 'arbol')
                .setScrollFactor(0.2)
                .setOrigin(0.5, 1)
                .setDisplaySize(120, 160)
                .setTint(0x173e2b)
                .setAlpha(0.85);
        }

        // Capa de neblina
        this.neblina = this.add.graphics().setScrollFactor(0.35).setAlpha(0.28);
        this.neblina.fillStyle(0xd9ede4, 1);
        for (let x = 0; x < this.mundoAncho; x += 320) {
            this.neblina.fillEllipse(x + 160, 480, 360, 70);
        }

        // Capa 3: Árboles majestuosos
        for (let x = 60; x <= this.mundoAncho; x += 400) {
            this.add.image(x, this.sueloY + 20, 'arbol_grande')
                .setScrollFactor(0.6)
                .setOrigin(0.5, 1)
                .setDisplaySize(280, 420)
                .setTint(0x235338)
                .setAlpha(0.9);
        }
    }

    /* -------------------------------------------------------------
     * BIODIVERSIDAD VIVA (Aves con animación de vuelo real, insectos)
     * ------------------------------------------------------------- */
    _crearBiodiversidadViva() {
        // Aves volando en el fondo usando la animación 'quetzal-vuelo' mapeada!
        this.avesFondo = [];
        for (let i = 0; i < 4; i++) {
            const ave = this.add.sprite(
                Phaser.Math.Between(100, 3800),
                Phaser.Math.Between(90, 260),
                'quetzal_volando_raw',
                'fly_0'
            )
                .setDisplaySize(90, 68)
                .setScrollFactor(0.35)
                .setTint(0x1e4a33)
                .setAlpha(0.7)
                .setDepth(2);

            ave.play('quetzal-vuelo');
            ave.velocidadX = Phaser.Math.Between(45, 80);
            ave.amplitudY = Phaser.Math.Between(15, 30);
            ave.baseY = ave.y;
            this.avesFondo.push(ave);
        }

        // Insectos polinizadores
        this.insectos = [];
        const colores = [0xffd700, 0x4dd0e1, 0xff80ab, 0x81c784];
        for (let i = 0; i < 28; i++) {
            const x = Phaser.Math.Between(100, this.mundoAncho - 100);
            const y = Phaser.Math.Between(380, this.sueloY - 20);
            const ins = this.add.circle(x, y, Phaser.Math.Between(2, 4), Phaser.Utils.Array.GetRandom(colores), 0.85)
                .setDepth(6);
            ins.baseX = x;
            ins.baseY = y;
            ins.radioOscilacion = Phaser.Math.Between(12, 35);
            ins.velocidad = Phaser.Math.FloatBetween(1.5, 3.5);
            this.insectos.push(ins);
        }
    }

    /* -------------------------------------------------------------
     * PLATAFORMAS Y SUELO
     * ------------------------------------------------------------- */
    _crearPlataformasYSuelo() {
        this.plataformas = this.physics.add.staticGroup();

        if (!this.textures.exists('textura-suelo-selva')) {
            const sueloG = this.make.graphics({ x: 0, y: 0, add: false });
            sueloG.fillStyle(0x2d1e14, 1);
            sueloG.fillRect(0, 0, 400, 160);
            sueloG.fillStyle(0x3e6b2c, 1);
            sueloG.fillRect(0, 0, 400, 24);
            sueloG.fillStyle(0x5c8e3a, 1);
            for (let i = 0; i < 400; i += 12) sueloG.fillRect(i, 0, 6, 8);
            sueloG.generateTexture('textura-suelo-selva', 400, 160);
            sueloG.destroy();
        }

        for (let x = 200; x <= this.mundoAncho + 200; x += 400) {
            const tile = this.plataformas.create(x, this.sueloY + 80, 'textura-suelo-selva');
            tile.body.setSize(400, 160);
            tile.setDepth(3);
        }

        // Rocas y arbustos
        for (let x = 120; x < this.mundoAncho - 200; x += Phaser.Math.Between(160, 320)) {
            if (Math.random() > 0.4) {
                this.add.image(x, this.sueloY - 4, 'roca')
                    .setDisplaySize(Phaser.Math.Between(35, 55), Phaser.Math.Between(25, 40))
                    .setOrigin(0.5, 1)
                    .setDepth(4);
            }
            if (Math.random() > 0.3) {
                this.add.image(x + 45, this.sueloY - 2, 'arbusto')
                    .setDisplaySize(Phaser.Math.Between(50, 75), Phaser.Math.Between(45, 65))
                    .setOrigin(0.5, 1)
                    .setDepth(4)
                    .setTint(0x4a7c3f);
            }
        }

        // Ramas escalables
        if (!this.textures.exists('textura-rama')) {
            const ramaG = this.make.graphics({ x: 0, y: 0, add: false });
            ramaG.fillStyle(0x422a1d, 1);
            ramaG.fillRoundedRect(0, 0, 220, 26, 8);
            ramaG.fillStyle(0x35632a, 1);
            ramaG.fillRect(10, 0, 200, 8);
            ramaG.generateTexture('textura-rama', 220, 26);
            ramaG.destroy();
        }

        const coordsRamas = [
            { x: 740, y: 530, w: 220 },
            { x: 920, y: 410, w: 220 },
            { x: 1100, y: 310, w: 220 }, // Rama del Quetzal
            { x: 1950, y: 520, w: 220 },
            { x: 2180, y: 400, w: 220 }, // Rama del Mono
            { x: 3000, y: 520, w: 220 },
            { x: 3220, y: 420, w: 220 }
        ];

        coordsRamas.forEach(r => {
            const rama = this.plataformas.create(r.x, r.y, 'textura-rama');
            rama.body.setSize(r.w, 24);
            rama.setDepth(4);

            const lianas = this.add.graphics().setDepth(3);
            lianas.lineStyle(3, 0x2d4d24, 0.85);
            lianas.beginPath();
            lianas.moveTo(r.x - 70, r.y + 12);
            lianas.lineTo(r.x - 65, r.y + 70);
            lianas.moveTo(r.x + 60, r.y + 12);
            lianas.lineTo(r.x + 65, r.y + 85);
            lianas.strokePath();
        });
    }

    /* -------------------------------------------------------------
     * JUGADOR
     * ------------------------------------------------------------- */
    _crearAnimacionesJugador() {
        const key = this.avatarKey;
        if (!this.anims.exists(`caminar-der-${key}`)) {
            this.anims.create({
                key: `caminar-der-${key}`,
                frames: this.anims.generateFrameNumbers(`avatar-${key}`, { start: 8, end: 11 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists(`caminar-izq-${key}`)) {
            this.anims.create({
                key: `caminar-izq-${key}`,
                frames: this.anims.generateFrameNumbers(`avatar-${key}`, { start: 4, end: 7 }),
                frameRate: 10,
                repeat: -1
            });
        }
        if (!this.anims.exists(`quieto-${key}`)) {
            this.anims.create({
                key: `quieto-${key}`,
                frames: [{ key: `avatar-${key}`, frame: 0 }],
                frameRate: 1
            });
        }
    }

    _crearJugador() {
        this.jugador = this.physics.add.sprite(150, this.sueloY, `avatar-${this.avatarKey}`, 0)
            .setOrigin(0.5, 1);
        this.jugador.setDisplaySize(60, 60);
        this.jugador.body.setSize(34, 52);
        this.jugador.body.setOffset(15, 12);
        this.jugador.setCollideWorldBounds(true);
        this.jugador.setDepth(7);
        this.jugador.direccion = 'derecha';

        this.physics.add.collider(this.jugador, this.plataformas);
    }

    /* -------------------------------------------------------------
     * FAUNA PACÍFICA DE CHIAPAS (Con Spritesheets Mapeados)
     * ------------------------------------------------------------- */
    _crearFaunaPacifica() {
        // 1. EL QUETZAL (Posado en rama alta con animación de plumaje)
        this.quetzal = this.physics.add.sprite(1160, 245, 'quetzal_volando_raw', 'perch_wings_folded');
        this.quetzal.setDisplaySize(100, 120);
        this.quetzal.body.setAllowGravity(false);
        this.quetzal.body.setImmovable(true);
        this.quetzal.setDepth(5);
        this.quetzal.play('quetzal-posado');

        // Zona de encuadre fotográfico justo bajo la rama
        this.quetzalFotoZona = this.add.zone(1160, 360, 240, 240);
        this.physics.add.existing(this.quetzalFotoZona, true);

        this.add.image(1160, 305, 'arbol')
            .setDisplaySize(200, 240)
            .setDepth(4)
            .setAlpha(0.9);

        // 2. EL TAPIR (Con spritesheet de caminar y huir)
        this.tapir = this.physics.add.sprite(1650, this.sueloY - 45, 'tapir_sheet', 0);
        this.tapir.setDisplaySize(145, 100);
        this.tapir.body.setSize(380, 240);
        this.tapir.body.setOffset(60, 160);
        this.tapir.setDepth(5);
        this.tapir.setCollideWorldBounds(false);
        this.tapir.play('tapir-caminar');
        this.physics.add.collider(this.tapir, this.plataformas);

        this.tapir.estado = 'pastando';
        this.tapir.velocidadNormal = -25;
        this.tapir.velocidadHuida = 340;

        // 3. EL MONO SARAGUATO
        this.monoArbol = this.add.image(2240, 360, 'arbol_grande')
            .setDisplaySize(320, 420)
            .setDepth(4);

        this.mono = this.physics.add.sprite(2240, 340, 'mono_img');
        this.mono.setDisplaySize(95, 90);
        this.mono.body.setAllowGravity(false);
        this.mono.body.setImmovable(true);
        this.mono.setDepth(5);
        this.mono.visiblePeriodo = true;
        this.mono.temporizadorEsconder = 0;

        // Balanceo sutil de cola/cuerpo
        this.tweens.add({
            targets: this.mono,
            y: 334,
            duration: 1400,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.InOut'
        });

        this.monoIconoAullido = this.add.text(2240, 280, '🔊 ¡AULLIDO!', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(6).setVisible(false);
    }

    /* -------------------------------------------------------------
     * FAUNA SALVAJE (Con Spritesheets Mapeados)
     * ------------------------------------------------------------- */
    _crearFaunaSalvaje() {
        this.grupoSalvajes = this.physics.add.group();

        // 1. MANADA DE PECARÍES (Con animación de trote en manada)
        this.pecaries = [];
        const posXBasePecari = 2650;
        for (let i = 0; i < 2; i++) {
            const pecari = this.physics.add.sprite(posXBasePecari + i * 160, this.sueloY - 30, 'pecari_sheet', 0);
            pecari.setDisplaySize(110, 80);
            pecari.body.setSize(380, 220);
            pecari.body.setOffset(50, 80);
            pecari.setDepth(5);
            pecari.velocidad = -190;
            pecari.baseX = posXBasePecari + i * 160;
            pecari.play('pecari-correr');
            this.physics.add.collider(pecari, this.plataformas);
            this.grupoSalvajes.add(pecari);
            this.pecaries.push(pecari);
        }

        // 2. EL JAGUAR (Con animación de carrera continua 'jaguar-correr')
        this.jaguar = this.physics.add.sprite(3600, this.sueloY - 50, 'jaguar_raw', 'run_0');
        this.jaguar.setDisplaySize(180, 110);
        this.jaguar.body.setSize(380, 200);
        this.jaguar.body.setOffset(40, 60);
        this.jaguar.setFlipX(true); // Mirando hacia la izquierda
        this.jaguar.setDepth(6);
        this.jaguar.velocidad = -360;
        this.jaguar.activo = false;
        this.jaguar.distanciaActivacion = 580;
        this.jaguar.saltado = false;
        this.jaguar.fotoTomada = false;
        this.jaguar.play('jaguar-correr');
        this.physics.add.collider(this.jaguar, this.plataformas);
        this.grupoSalvajes.add(this.jaguar);

        this.avisoJaguar = this.add.text(3200, 480, '⚠️ ¡RUGIDO EN LA SELVA! PREPARA TU SALTO', {
            fontSize: '16px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffdd57',
            backgroundColor: 'rgba(150, 20, 20, 0.85)',
            padding: { x: 10, y: 6 }
        }).setOrigin(0.5).setDepth(8).setVisible(false);

        this.physics.add.overlap(this.jugador, this.grupoSalvajes, this._alColisionarSalvaje, null, this);
    }

    /* -------------------------------------------------------------
     * FLORA RECOLECTABLE (Muestras Mapeadas Individualmente)
     * ------------------------------------------------------------- */
    _crearFloraRecolectable() {
        this.muestrasFlora = [
            {
                id: 'flora_orquidea',
                x: 820,
                y: this.sueloY - 30,
                nombre: 'Orquídea Selva Lacandona',
                frameKey: 'orquidea',
                sprite: null,
                recolectada: false
            },
            {
                id: 'flora_helecho',
                x: 1840,
                y: this.sueloY - 30,
                nombre: 'Helecho Arborescente Fósil',
                frameKey: 'helecho',
                sprite: null,
                recolectada: false
            }
        ];

        this.muestrasFlora.forEach(m => {
            m.sprite = this.add.image(m.x, m.y, 'flora_strip', m.frameKey)
                .setDisplaySize(70, 55)
                .setDepth(4);

            m.halo = this.add.circle(m.x, m.y - 10, 24, 0xa3e635, 0.45).setDepth(3);
            this.tweens.add({
                targets: m.halo,
                scale: 1.4,
                alpha: 0.1,
                duration: 900,
                yoyo: true,
                repeat: -1
            });
        });
    }

    /* -------------------------------------------------------------
     * ESTACIÓN FINAL
     * ------------------------------------------------------------- */
    _crearEstacionFinal() {
        const finX = 3980;
        const estacion = this.add.graphics().setDepth(4);
        estacion.fillStyle(0x3e2723, 1);
        estacion.fillRect(finX - 110, this.sueloY - 140, 220, 140);
        estacion.fillStyle(0x558b2f, 1);
        estacion.fillTriangle(finX - 130, this.sueloY - 140, finX, this.sueloY - 210, finX + 130, this.sueloY - 140);
        estacion.fillStyle(0x8d6e63, 1);
        estacion.fillRect(finX - 35, this.sueloY - 95, 70, 95);

        this.add.text(finX, this.sueloY - 165, 'ESTACIÓN BIOLÓGICA CHIAPAS', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fff',
            backgroundColor: '#1b5e20',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setDepth(5);

        this.add.text(finX, this.sueloY - 115, '🏆 META DE EXPEDICIÓN\nPresiona [S / ENTER] para completar', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#dcedc8',
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        this.estacionZona = this.add.zone(finX, this.sueloY - 50, 160, 120);
        this.physics.add.existing(this.estacionZona, true);
    }

    /* -------------------------------------------------------------
     * CÁMARA Y CONTROLES
     * ------------------------------------------------------------- */
    _crearCamara() {
        this.cameras.main.setBounds(0, 0, this.mundoAncho, this.mundoAlto);
        this.cameras.main.startFollow(this.jugador, true, 0.08, 0.08);
        this.cameras.main.setFollowOffset(-60, 40);
    }

    _crearControles() {
        this.teclado = this.input.keyboard.createCursorKeys();
        this.input.keyboard.addCapture([
            Phaser.Input.Keyboard.KeyCodes.UP,
            Phaser.Input.Keyboard.KeyCodes.DOWN,
            Phaser.Input.Keyboard.KeyCodes.LEFT,
            Phaser.Input.Keyboard.KeyCodes.RIGHT,
            Phaser.Input.Keyboard.KeyCodes.SPACE
        ]);
        this.teclaW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.teclaA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.teclaS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
        this.teclaD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.teclaEspacio = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.teclaEnter = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        this.teclaE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.teclaB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);
        this.teclaESC = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        this.teclaN = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.N);

        this.teclaB.on('down', () => this._alternarModalBitacora());
        this.teclaESC.on('down', () => {
            if (this.modalBitacoraAbierto) this._alternarModalBitacora();
            else this._salirDeSala();
        });
        this.teclaN.on('down', () => {
            if (this.modalBitacoraAbierto) this._alternarModalBitacora();
            else this._salirDeSala();
        });
    }

    /* -------------------------------------------------------------
     * HUD
     * ------------------------------------------------------------- */
    _crearHUD() {
        this.contenedorHUD = this.add.container(0, 0).setScrollFactor(0).setDepth(20);

        const barraSup = this.add.graphics();
        barraSup.fillStyle(0x0f2416, 0.85);
        barraSup.fillRoundedRect(15, 12, 970, 56, 12);
        barraSup.lineStyle(2, 0x4ade80, 0.4);
        barraSup.strokeRoundedRect(15, 12, 970, 56, 12);
        this.contenedorHUD.add(barraSup);

        const titulo = this.add.text(32, 22, 'EXPEDICIÓN CHIAPAS', {
            fontSize: '18px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#4ade80'
        });
        const subtitulo = this.add.text(32, 43, 'Biodiversidad y Conservación', {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#a7f3d0'
        });
        this.contenedorHUD.add([titulo, subtitulo]);

        this.textoCorazones = this.add.text(260, 26, 'VIDA: ❤️❤️❤️', {
            fontSize: '17px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#f87171'
        });
        this.contenedorHUD.add(this.textoCorazones);

        this.textoContadorEspecies = this.add.text(430, 28, '📓 ESPECIES: 0 / 7', {
            fontSize: '15px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fef08a'
        });
        this.contenedorHUD.add(this.textoContadorEspecies);

        // Botón Bitácora
        const btnBitacora = this.add.container(660, 40);
        const btnBG = this.add.graphics();
        btnBG.fillStyle(0x166534, 1);
        btnBG.fillRoundedRect(-65, -18, 130, 36, 8);
        btnBG.lineStyle(1.5, 0x86efac, 0.8);
        btnBG.strokeRoundedRect(-65, -18, 130, 36, 8);
        const btnTxt = this.add.text(0, 0, '📖 BITÁCORA [B]', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        btnBitacora.add([btnBG, btnTxt]);
        btnBitacora.setSize(130, 36);
        btnBitacora.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._alternarModalBitacora())
            .on('pointerover', () => btnBitacora.setScale(1.05))
            .on('pointerout', () => btnBitacora.setScale(1.0));
        this.contenedorHUD.add(btnBitacora);

        // Botón Salir
        const btnSalir = this.add.container(890, 40);
        const salirBG = this.add.graphics();
        salirBG.fillStyle(0x7f1d1d, 0.9);
        salirBG.fillRoundedRect(-55, -18, 110, 36, 8);
        salirBG.lineStyle(1.5, 0xfca5a5, 0.8);
        salirBG.strokeRoundedRect(-55, -18, 110, 36, 8);
        const salirTxt = this.add.text(0, 0, 'SALIR [ESC]', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fff'
        }).setOrigin(0.5);
        btnSalir.add([salirBG, salirTxt]);
        btnSalir.setSize(110, 36);
        btnSalir.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._salirDeSala())
            .on('pointerover', () => btnSalir.setScale(1.05))
            .on('pointerout', () => btnSalir.setScale(1.0));
        this.contenedorHUD.add(btnSalir);

        // Prompt de acción interactivo
        this.promptAccion = this.add.container(500, 720).setScrollFactor(0).setDepth(25).setVisible(false);
        const promptBG = this.add.graphics();
        promptBG.fillStyle(0x064e3b, 0.95);
        promptBG.fillRoundedRect(-220, -22, 440, 44, 10);
        promptBG.lineStyle(2, 0xa7f3d0, 1);
        promptBG.strokeRoundedRect(-220, -22, 440, 44, 10);
        this.promptTexto = this.add.text(0, 0, '📷 Presiona [ENTER / E / ACEPTAR] para tomar FOTO', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ecfdf5'
        }).setOrigin(0.5);
        this.promptAccion.add([promptBG, this.promptTexto]);

        this.flashCamara = this.add.rectangle(500, 400, 1000, 800, 0xffffff, 0).setScrollFactor(0).setDepth(30);

        this.reticulaCamara = this.add.graphics().setScrollFactor(0).setDepth(28).setVisible(false);
        this.reticulaCamara.lineStyle(3, 0xffffff, 0.9);
        this.reticulaCamara.strokeRect(300, 200, 400, 360);
        this.reticulaCamara.lineBetween(480, 380, 520, 380);
        this.reticulaCamara.lineBetween(500, 360, 500, 400);

        this.bannerNotif = this.add.container(500, 100).setScrollFactor(0).setDepth(35).setVisible(false);
        const banBG = this.add.graphics();
        banBG.fillStyle(0x064e3b, 0.95);
        banBG.fillRoundedRect(-320, -25, 640, 50, 12);
        banBG.lineStyle(2, 0x34d399, 1);
        banBG.strokeRoundedRect(-320, -25, 640, 50, 12);
        this.bannerTexto = this.add.text(0, 0, '', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ecfdf5',
            align: 'center'
        }).setOrigin(0.5);
        this.bannerNotif.add([banBG, this.bannerTexto]);
    }

    _mostrarNotificacion(mensaje, colorBorde = '#34d399', duracion = 3200) {
        this.bannerTexto.setText(mensaje);
        this.bannerNotif.setVisible(true).setAlpha(0).setScale(0.85);
        this.tweens.add({
            targets: this.bannerNotif,
            alpha: 1,
            scale: 1,
            duration: 250,
            ease: 'Back.Out',
            onComplete: () => {
                this.time.delayedCall(duracion, () => {
                    this.tweens.add({
                        targets: this.bannerNotif,
                        alpha: 0,
                        scale: 0.9,
                        duration: 300,
                        onComplete: () => this.bannerNotif.setVisible(false)
                    });
                });
            }
        });
    }

    /* -------------------------------------------------------------
     * BITÁCORA DE CAMPO
     * ------------------------------------------------------------- */
    _crearModalBitacora() {
        this.contenedorBitacora = this.add.container(500, 400).setScrollFactor(0).setDepth(50).setVisible(false);

        const blackout = this.add.rectangle(0, 0, 1000, 800, 0x000000, 0.75);
        blackout.setInteractive();

        const libreta = this.add.graphics();
        libreta.fillStyle(0x3e2723, 1);
        libreta.fillRoundedRect(-440, -320, 880, 640, 18);
        libreta.lineStyle(4, 0x8d6e63, 1);
        libreta.strokeRoundedRect(-440, -320, 880, 640, 18);

        libreta.fillStyle(0xfaf3e0, 1);
        libreta.fillRoundedRect(-415, -295, 400, 590, 8);
        libreta.fillRoundedRect(15, -295, 400, 590, 8);

        libreta.fillStyle(0x27160c, 0.4);
        libreta.fillRect(-15, -295, 30, 590);

        const titLibreta = this.add.text(-215, -260, '🌿 BITÁCORA DE CAMPO', {
            fontSize: '20px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'bold',
            color: '#2e1c0c'
        }).setOrigin(0.5);

        const subLibreta = this.add.text(-215, -230, 'Selva Lacandona y Bosque de Niebla', {
            fontSize: '12px',
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            color: '#5d4037'
        }).setOrigin(0.5);

        const btnCerrar = this.add.text(385, -270, '✕ CERRAR', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#b71c1c',
            backgroundColor: '#ffcdd2',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });
        btnCerrar.on('pointerdown', () => this._alternarModalBitacora());

        this.contenedorBitacora.add([blackout, libreta, titLibreta, subLibreta, btnCerrar]);

        this.elementosListaBitacora = this.add.container(0, 0);
        this.contenedorBitacora.add(this.elementosListaBitacora);

        this.elementosDetalleBitacora = this.add.container(0, 0);
        this.contenedorBitacora.add(this.elementosDetalleBitacora);
    }

    _actualizarContenidoBitacora(especieIdSeleccionada = null) {
        this.elementosListaBitacora.removeAll(true);
        this.elementosDetalleBitacora.removeAll(true);

        const especies = Object.values(this.bitacora);
        let primeraRegistrada = null;
        let yPos = -190;

        especies.forEach((esp) => {
            if (esp.registrada && !primeraRegistrada) primeraRegistrada = esp.id;

            const box = this.add.graphics();
            const esActiva = (especieIdSeleccionada === esp.id) || (!especieIdSeleccionada && primeraRegistrada === esp.id);

            box.fillStyle(esActiva ? 0xd7ccc8 : (esp.registrada ? 0xe8f5e9 : 0xeeeeee), 0.95);
            box.fillRoundedRect(-400, yPos, 370, 52, 6);
            box.lineStyle(1.5, esActiva ? 0x4e342e : (esp.registrada ? 0x2e7d32 : 0xbdbdbd), 1);
            box.strokeRoundedRect(-400, yPos, 370, 52, 6);

            const txtIcon = this.add.text(-385, yPos + 14, esp.registrada ? '✔' : '❓', {
                fontSize: '18px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: esp.registrada ? '#1b5e20' : '#757575'
            });

            const txtNombre = this.add.text(-355, yPos + 8, esp.registrada ? esp.nombre : 'Especie no avistada', {
                fontSize: '13px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: esp.registrada ? '#1a237e' : '#616161'
            });

            const txtCientifico = this.add.text(-355, yPos + 28, esp.registrada ? esp.cientifico : 'Explora la selva para registrar', {
                fontSize: '11px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: esp.registrada ? '#455a64' : '#9e9e9e'
            });

            const zonaClick = this.add.zone(-215, yPos + 26, 370, 52)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this._actualizarContenidoBitacora(esp.id));

            this.elementosListaBitacora.add([box, txtIcon, txtNombre, txtCientifico, zonaClick]);
            yPos += 64;
        });

        const targetId = especieIdSeleccionada || primeraRegistrada || especies[0].id;
        const det = this.bitacora[targetId];

        if (det && det.registrada) {
            const marcoFoto = this.add.graphics();
            marcoFoto.fillStyle(0xffffff, 1);
            marcoFoto.fillRoundedRect(55, -240, 320, 160, 6);
            marcoFoto.lineStyle(2, 0x8d6e63, 1);
            marcoFoto.strokeRoundedRect(55, -240, 320, 160, 6);

            // Cargar imagen con el frame exacto mapeado
            const imgEspecie = this.add.image(215, -160, det.texturaKey, det.frameKey !== null ? det.frameKey : undefined);
            if (det.id === 'quetzal') imgEspecie.setDisplaySize(130, 140);
            else if (det.id === 'tapir') imgEspecie.setDisplaySize(160, 110);
            else if (det.id === 'mono') imgEspecie.setDisplaySize(110, 110);
            else if (det.id === 'pecari') imgEspecie.setDisplaySize(140, 100);
            else if (det.id === 'jaguar') imgEspecie.setDisplaySize(110, 140);
            else imgEspecie.setDisplaySize(120, 95);

            let badgeExtra = det.fotoLegendaria ? ' ⭐ FOTO LEGENDARIA' : '';
            const detNombre = this.add.text(215, -60, `${det.nombre}${badgeExtra}`, {
                fontSize: '16px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'bold',
                color: '#1b5e20',
                align: 'center',
                wordWrap: { width: 340 }
            }).setOrigin(0.5);

            const detCient = this.add.text(215, -35, `Nombre científico: ${det.cientifico}`, {
                fontSize: '12px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#3e2723'
            }).setOrigin(0.5);

            const detHabitat = this.add.text(45, -10, `🏞 Hábitat: ${det.habitat}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#2e7d32',
                wordWrap: { width: 340 }
            });

            const detEstado = this.add.text(45, 25, `🛡 Estado: ${det.estado}`, {
                fontSize: '12px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#c62828',
                wordWrap: { width: 340 }
            });

            const detDesc = this.add.text(45, 65, det.desc, {
                fontSize: '13px',
                fontFamily: 'Georgia, serif',
                color: '#212121',
                lineSpacing: 5,
                wordWrap: { width: 340 }
            });

            this.elementosDetalleBitacora.add([marcoFoto, imgEspecie, detNombre, detCient, detHabitat, detEstado, detDesc]);
        } else {
            const silueta = this.add.text(215, -100, '❓', {
                fontSize: '64px',
                color: '#9e9e9e'
            }).setOrigin(0.5);

            const avisoNoReg = this.add.text(215, 0, 'ESPECIE AÚN NO REGISTRADA\n\nCamina sigilosamente por la selva,\nobserva las copas de los árboles,\nsalta sobre los animales salvajes y\nrecolecta muestras con [ENTER / E].', {
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#5d4037',
                align: 'center',
                lineSpacing: 6,
                wordWrap: { width: 320 }
            }).setOrigin(0.5);

            this.elementosDetalleBitacora.add([silueta, avisoNoReg]);
        }
    }

    _alternarModalBitacora() {
        this.modalBitacoraAbierto = !this.modalBitacoraAbierto;
        if (this.modalBitacoraAbierto) {
            this._actualizarContenidoBitacora();
            this.contenedorBitacora.setVisible(true).setScale(0.85).setAlpha(0);
            this.tweens.add({
                targets: this.contenedorBitacora,
                scale: 1,
                alpha: 1,
                duration: 250,
                ease: 'Back.Out'
            });
        } else {
            this.tweens.add({
                targets: this.contenedorBitacora,
                scale: 0.9,
                alpha: 0,
                duration: 200,
                onComplete: () => this.contenedorBitacora.setVisible(false)
            });
        }
    }

    /* -------------------------------------------------------------
     * UPDATE
     * ------------------------------------------------------------- */
    update(time, delta) {
        if (this._transitando) return;

        if (this.modalBitacoraAbierto) {
            this.jugador.setVelocityX(0);
            return;
        }

        this._procesarMovimientoJugador();
        this._actualizarBiodiversidadViva(time);
        this._actualizarFaunaPacifica(delta);
        this._actualizarFaunaSalvaje(delta);
        this._comprobarInteracciones();
    }

    /* -------------------------------------------------------------
     * MOVIMIENTO DEL JUGADOR
     * ------------------------------------------------------------- */
    _procesarMovimientoJugador() {
        const enSuelo = this.jugador.body.blocked.down || this.jugador.body.touching.down;
        let velocidadBase = 220;

        const mueveIzq = this.teclado.left.isDown || this.teclaA.isDown || (window.mobileControls && window.mobileControls.isDown('left'));
        const mueveDer = this.teclado.right.isDown || this.teclaD.isDown || (window.mobileControls && window.mobileControls.isDown('right'));
        const agachar = this.teclado.down.isDown || this.teclaS.isDown || (window.mobileControls && window.mobileControls.isDown('down'));
        const saltar = Phaser.Input.Keyboard.JustDown(this.teclado.up) ||
            Phaser.Input.Keyboard.JustDown(this.teclaW) ||
            Phaser.Input.Keyboard.JustDown(this.teclaEspacio) ||
            (window.mobileControls && window.mobileControls.consume('up'));

        // Modo Agachado / Sigilo
        if (agachar && enSuelo) {
            if (!this.agachado) {
                this.agachado = true;
                this.jugador.setDisplaySize(60, 38);
                this.jugador.body.setSize(34, 32);
                this.jugador.body.setOffset(15, 32);
            }
        } else if (!agachar && this.agachado) {
            this.agachado = false;
            this.jugador.setDisplaySize(60, 60);
            this.jugador.body.setSize(34, 52);
            this.jugador.body.setOffset(15, 12);
        }

        const velocidad = this.agachado ? 95 : 220;

        if (mueveIzq) {
            this.jugador.setVelocityX(-velocidad);
            this.jugador.direccion = 'izquierda';
            this.jugador.play(`caminar-izq-${this.avatarKey}`, true);
        } else if (mueveDer) {
            this.jugador.setVelocityX(velocidad);
            this.jugador.direccion = 'derecha';
            this.jugador.play(`caminar-der-${this.avatarKey}`, true);
        } else {
            this.jugador.setVelocityX(0);
            this.jugador.play(`quieto-${this.avatarKey}`, true);
        }

        if (saltar && enSuelo) {
            if (this.agachado) {
                this.agachado = false;
                this.jugador.setDisplaySize(60, 60);
                this.jugador.body.setSize(34, 52);
                this.jugador.body.setOffset(15, 12);
            }
            this.jugador.setVelocityY(-540);
            this._reproducirSonido('salto');
        }
    }

    _actualizarBiodiversidadViva(time) {
        this.avesFondo.forEach(ave => {
            ave.x += ave.velocidadX * 0.016;
            ave.y = ave.baseY + Math.sin(time * 0.003 + ave.x * 0.01) * ave.amplitudY;
            if (ave.x > this.mundoAncho + 200) {
                ave.x = -150;
            }
        });

        this.insectos.forEach(ins => {
            ins.x = ins.baseX + Math.cos(time * 0.002 * ins.velocidad) * ins.radioOscilacion;
            ins.y = ins.baseY + Math.sin(time * 0.003 * ins.velocidad) * (ins.radioOscilacion * 0.6);
        });
    }

    /* -------------------------------------------------------------
     * ACTUALIZACIÓN: FAUNA PACÍFICA
     * ------------------------------------------------------------- */
    _actualizarFaunaPacifica(delta) {
        // 1. TAPIR
        const distTapir = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.tapir.x, this.tapir.y);

        if (this.tapir.estado === 'pastando') {
            this.tapir.setVelocityX(this.tapir.velocidadNormal);
            if (this.tapir.x < 1550) this.tapir.velocidadNormal = 25;
            if (this.tapir.x > 1750) this.tapir.velocidadNormal = -25;
            this.tapir.setFlipX(this.tapir.velocidadNormal > 0);

            const corriendoRapido = Math.abs(this.jugador.body.velocity.x) > 140;
            if (distTapir < 210 && corriendoRapido && !this.agachado) {
                this.tapir.estado = 'asustado';
                this.tapir.play('tapir-correr', true);
                this._reproducirSonido('tapir_alerta');
                this._mostrarNotificacion('⚠️ ¡El Tapir se asustó con tus pasos rápidos! Acércate en SIGILO [ABAJO / S]', '#f87171', 3500);

                const alerta = this.add.text(this.tapir.x, this.tapir.y - 60, '❗', {
                    fontSize: '28px',
                    color: '#ff1744'
                }).setOrigin(0.5).setDepth(8);
                this.tweens.add({
                    targets: alerta,
                    y: this.tapir.y - 95,
                    alpha: 0,
                    duration: 900,
                    onComplete: () => alerta.destroy()
                });

                this.time.delayedCall(400, () => {
                    this.tapir.estado = 'huyendo';
                    this.tapir.setVelocityX(this.tapir.velocidadHuida);
                    this.tapir.setFlipX(true);
                });
            }
        } else if (this.tapir.estado === 'huyendo') {
            this.tapir.setVelocityX(this.tapir.velocidadHuida);
            if (this.tapir.x > 2100) {
                this.tapir.x = 1680;
                this.tapir.estado = 'pastando';
                this.tapir.setVelocityX(-25);
                this.tapir.play('tapir-caminar', true);
            }
        }

        // 2. MONO SARAGUATO
        this.mono.temporizadorEsconder += delta;
        if (this.mono.temporizadorEsconder > 4000) {
            this.mono.temporizadorEsconder = 0;
            this.mono.visiblePeriodo = !this.mono.visiblePeriodo;

            if (this.mono.visiblePeriodo) {
                this.mono.setAlpha(1);
                this.monoIconoAullido.setVisible(true);
                this._reproducirSonido('rugido');
                this.time.delayedCall(1600, () => this.monoIconoAullido.setVisible(false));
            } else {
                this.mono.setAlpha(0.2);
                this.monoIconoAullido.setVisible(false);
            }
        }
    }

    /* -------------------------------------------------------------
     * ACTUALIZACIÓN: FAUNA SALVAJE
     * ------------------------------------------------------------- */
    _actualizarFaunaSalvaje(delta) {
        // 1. PECARÍES
        this.pecaries.forEach(p => {
            p.setVelocityX(p.velocidad);
            if (p.x < 2250) {
                p.x = p.baseX;
            }
        });

        // 2. JAGUAR
        const distJugadorJaguar = this.jaguar.x - this.jugador.x;

        if (!this.jaguar.activo && distJugadorJaguar > 0 && distJugadorJaguar < this.jaguar.distanciaActivacion) {
            this.jaguar.activo = true;
            this.avisoJaguar.setVisible(true);
            this._reproducirSonido('rugido');
            this.time.delayedCall(2200, () => this.avisoJaguar.setVisible(false));
        }

        if (this.jaguar.activo) {
            this.jaguar.setVelocityX(this.jaguar.velocidad);

            if (!this.jaguar.saltado && this.jugador.x > this.jaguar.x && this.jugador.y < this.jaguar.y - 20) {
                this.jaguar.saltado = true;
                this._mostrarNotificacion('⚡ ¡SALTÓ AL JAGUAR! Presiona [ENTER / E] mientras corre de espaldas para la FOTO LEGENDARIA', '#fef08a', 2800);
            }

            if (this.jaguar.x < 3100) {
                this.jaguar.x = 3850;
                this.jaguar.activo = false;
                this.jaguar.saltado = false;
            }
        }
    }

    /* -------------------------------------------------------------
     * INTERACCIONES
     * ------------------------------------------------------------- */
    _comprobarInteracciones() {
        const accionPresionada = Phaser.Input.Keyboard.JustDown(this.teclaEnter) ||
            Phaser.Input.Keyboard.JustDown(this.teclaE) ||
            (window.mobileControls && window.mobileControls.consume('enter'));

        let puedeInteractuar = false;
        let mensajeAccion = '';

        // 1. Quetzal
        const enZonaQuetzal = this.physics.overlap(this.jugador, this.quetzalFotoZona);
        if (enZonaQuetzal && !this.bitacora.quetzal.registrada) {
            puedeInteractuar = true;
            mensajeAccion = '📷 Presiona [ENTER / E] para fotografiar al Quetzal';
            if (accionPresionada) {
                this._tomarFotoEspecie('quetzal');
                return;
            }
        }

        // 2. Tapir
        const distTapir = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.tapir.x, this.tapir.y);
        if (distTapir < 150 && this.tapir.estado === 'pastando' && !this.bitacora.tapir.registrada) {
            puedeInteractuar = true;
            mensajeAccion = '📷 Presiona [ENTER / E] para fotografiar al Tapir';
            if (accionPresionada) {
                this._tomarFotoEspecie('tapir');
                return;
            }
        }

        // 3. Mono
        const distMono = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.mono.x, this.mono.y);
        if (distMono < 260 && this.mono.visiblePeriodo && !this.bitacora.mono.registrada) {
            puedeInteractuar = true;
            mensajeAccion = '📷 Presiona [ENTER / E] para fotografiar al Mono Saraguato';
            if (accionPresionada) {
                this._tomarFotoEspecie('mono');
                return;
            }
        }

        // 4. Jaguar (Foto Legendaria)
        if (this.jaguar.saltado && !this.jaguar.fotoTomada) {
            const distJaguar = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.jaguar.x, this.jaguar.y);
            if (distJaguar < 300) {
                puedeInteractuar = true;
                mensajeAccion = '⭐ ¡FOTO LEGENDARIA! Presiona [ENTER / E] AHORA';
                if (accionPresionada) {
                    this.jaguar.fotoTomada = true;
                    this.bitacora.jaguar.fotoLegendaria = true;
                    this._tomarFotoEspecie('jaguar');
                    return;
                }
            }
        }

        // 5. Pecaríes
        this.pecaries.forEach(p => {
            const distP = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, p.x, p.y);
            if (distP < 140 && !this.bitacora.pecari.registrada) {
                puedeInteractuar = true;
                mensajeAccion = '📷 Presiona [ENTER / E] para fotografiar la manada de Pecaríes';
                if (accionPresionada) {
                    this._tomarFotoEspecie('pecari');
                }
            }
        });

        // 6. Flora
        this.muestrasFlora.forEach(m => {
            if (!m.recolectada) {
                const distF = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, m.x, m.y);
                if (distF < 90) {
                    puedeInteractuar = true;
                    mensajeAccion = `🌱 Presiona [ENTER / E] para recolectar muestra de ${m.nombre}`;
                    if (accionPresionada) {
                        this._recolectarMuestraFlora(m);
                    }
                }
            }
        });

        // 7. Estación Final
        if (this.physics.overlap(this.jugador, this.estacionZona)) {
            puedeInteractuar = true;
            mensajeAccion = '🏆 ¡EXPEDICIÓN COMPLETADA! Presiona [ENTER] para revisar tu Bitácora y volver';
            if (accionPresionada) {
                this._alternarModalBitacora();
            }
        }

        if (puedeInteractuar) {
            this.promptTexto.setText(mensajeAccion);
            this.promptAccion.setVisible(true);
        } else {
            this.promptAccion.setVisible(false);
        }
    }

    _tomarFotoEspecie(id) {
        if (!this.bitacora[id]) return;
        this.bitacora[id].registrada = true;

        this._reproducirSonido('foto');

        this.reticulaCamara.setVisible(true);
        this.flashCamara.setAlpha(0.9);
        this.tweens.add({
            targets: this.flashCamara,
            alpha: 0,
            duration: 350,
            onComplete: () => this.reticulaCamara.setVisible(false)
        });

        const leyenda = this.bitacora[id].fotoLegendaria
            ? `⭐ ¡FOTO LEGENDARIA! ${this.bitacora[id].nombre} registrada en la Bitácora`
            : `📷 ¡FOTO CAPTURADA! ${this.bitacora[id].nombre} registrada en la Bitácora`;

        this._mostrarNotificacion(leyenda, '#fef08a', 4000);
        this._actualizarContadorHUD();
    }

    _recolectarMuestraFlora(muestra) {
        muestra.recolectada = true;
        this.bitacora[muestra.id].registrada = true;

        this._reproducirSonido('muestra');

        this.tweens.add({
            targets: [muestra.sprite, muestra.halo],
            y: muestra.y - 50,
            alpha: 0,
            scale: 1.5,
            duration: 500,
            onComplete: () => {
                muestra.sprite.setVisible(false);
                muestra.halo.destroy();
            }
        });

        this._mostrarNotificacion(`🌱 ¡Muestra recolectada! ${muestra.nombre} registrada en la Bitácora`, '#86efac', 3800);
        this._actualizarContadorHUD();
    }

    _alColisionarSalvaje(jugador, salvaje) {
        if (this.invulnerable) return;

        this.invulnerable = true;
        this.vidas -= 1;
        this._reproducirSonido('dano');

        let strVidas = '';
        for (let i = 0; i < this.vidasMax; i++) {
            strVidas += (i < this.vidas) ? '❤️' : '🖤';
        }
        this.textoCorazones.setText(`VIDA: ${strVidas}`);

        jugador.setVelocityY(-260);
        jugador.setVelocityX(jugador.x < salvaje.x ? -220 : 220);

        this.cameras.main.flash(250, 180, 20, 20);

        this.tweens.add({
            targets: jugador,
            alpha: 0.25,
            yoyo: true,
            repeat: 5,
            duration: 180,
            onComplete: () => {
                jugador.setAlpha(1);
                this.invulnerable = false;
            }
        });

        if (this.vidas <= 0) {
            this._manejarDerrota();
        }
    }

    _manejarDerrota() {
        this._mostrarNotificacion('⚠️ ¡Fuiste embestido! Descansando en el campamento...', '#f87171', 3000);
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.time.delayedCall(600, () => {
            this.vidas = 3;
            this.agachado = false;
            this.jugador.setDisplaySize(60, 60);
            this.jugador.body.setSize(34, 52);
            this.jugador.body.setOffset(15, 12);
            this.jugador.setPosition(150, this.sueloY);
            this.jugador.setVelocity(0, 0);
            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.invulnerable = false;
        });
    }

    _actualizarContadorHUD() {
        const total = Object.values(this.bitacora).filter(e => e.registrada).length;
        this.textoContadorEspecies.setText(`📓 ESPECIES: ${total} / 7`);
    }

    _salirDeSala() {
        if (this._transitando) return;
        this._transitando = true;

        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EscenaJuego', {
                avatarKey: this.avatarKey,
                posInicial: { x: 1400, y: 900 },
                ignoreEscape: true
            });
        });
    }
}
