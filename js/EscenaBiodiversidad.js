/**
 * EscenaBiodiversidad.js - Expedición Chiapas: Selva Lacandona, Bosque de Niebla y Capas de la Tierra
 * Mapeo completo de Spritesheets para Fauna, Flora y Sección Geológica de la Litosfera
 */
class EscenaBiodiversidad extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaBiodiversidad' });
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
        this.mundoAlto = 880;
        this.sueloY = 670; // Posición Y del suelo
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
        this.cameras.main.setBackgroundColor('#38bdf8');
        this.physics.world.gravity.y = 1100;
        this.physics.world.setBounds(0, 0, this.mundoAncho, this.mundoAlto);

        this._inicializarAudio();
        this._mapearFramesYAnimaciones();
        this._crearFondoParalaje();
        this._crearPlataformasYSuelo();
        this._crearCapasDeLaTierra();
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
        this._mostrarNotificacion('🌿 Expedición Chiapas: Selva, Biodiversidad y Capas de la Tierra', '#a1e44d', 4500);
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

        if (this.anims.exists('quetzal-vuelo')) this.anims.remove('quetzal-vuelo');
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
            frameRate: 5,
            repeat: -1
        });

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
     * PARALAJE MULTICAPA (CIELO AZUL Y NUBES FLOTANTES)
     * ------------------------------------------------------------- */
    _crearFondoParalaje() {
        // Capa 0: Cielo Azul Turquesa / Celeste Vibrante
        const cielo = this.add.graphics().setScrollFactor(0).setDepth(-10);
        cielo.fillGradientStyle(0x0284c7, 0x0284c7, 0x38bdf8, 0xbae6fd, 1);
        cielo.fillRect(0, 0, 2000, 1200);

        // Sol Radiante en el cielo
        const sol = this.add.graphics().setScrollFactor(0.01).setDepth(-9);
        sol.fillStyle(0xfffbeb, 0.95);
        sol.fillCircle(820, 100, 48);
        sol.fillStyle(0xfef08a, 0.45);
        sol.fillCircle(820, 100, 72);
        sol.fillStyle(0xfde047, 0.22);
        sol.fillCircle(820, 100, 102);

        // Rayos de luz dorados
        const rayos = this.add.graphics().setScrollFactor(0.02).setAlpha(0.22).setDepth(-8);
        rayos.fillStyle(0xfffbeb, 1);
        for (let i = 0; i < 8; i++) {
            rayos.fillTriangle(
                100 + i * 160, 0,
                220 + i * 180, this.mundoAlto,
                40 + i * 180, this.mundoAlto
            );
        }

        // TEXTURA DE NUBES BLANCAS ESPONJOSAS
        if (!this.textures.exists('textura-nube-esponjosa')) {
            const nubeG = this.make.graphics({ x: 0, y: 0, add: false });
            nubeG.fillStyle(0xffffff, 0.94);
            nubeG.fillCircle(40, 35, 25);
            nubeG.fillCircle(65, 25, 30);
            nubeG.fillCircle(95, 25, 28);
            nubeG.fillCircle(120, 35, 22);
            nubeG.fillRect(40, 25, 80, 25);

            // Sombra suave en la base de la nube
            nubeG.fillStyle(0xe2e8f0, 0.55);
            nubeG.fillRect(35, 42, 90, 8);
            nubeG.generateTexture('textura-nube-esponjosa', 160, 60);
            nubeG.destroy();
        }

        // Instanciar nubes flotantes a lo largo del cielo en la escena
        this.nubesSky = [];
        const posicionesNubes = [
            { x: 180, y: 70, scale: 1.2, alpha: 0.9, speed: 0.8 },
            { x: 650, y: 110, scale: 0.9, alpha: 0.8, speed: 0.6 },
            { x: 1200, y: 60, scale: 1.4, alpha: 0.92, speed: 1.0 },
            { x: 1750, y: 130, scale: 0.85, alpha: 0.75, speed: 0.7 },
            { x: 2300, y: 80, scale: 1.3, alpha: 0.88, speed: 0.9 },
            { x: 2900, y: 100, scale: 1.1, alpha: 0.82, speed: 0.75 },
            { x: 3550, y: 65, scale: 1.5, alpha: 0.9, speed: 1.1 },
            { x: 4000, y: 120, scale: 0.95, alpha: 0.78, speed: 0.65 }
        ];

        posicionesNubes.forEach(p => {
            const nube = this.add.image(p.x, p.y, 'textura-nube-esponjosa')
                .setScrollFactor(0.12)
                .setScale(p.scale)
                .setAlpha(p.alpha)
                .setDepth(1);
            nube.speed = p.speed;
            this.nubesSky.push(nube);
        });

        // Capa 1: Montañas lejanas (Verde/Azul montañoso)
        const montanasLejanas = this.add.graphics().setScrollFactor(0.08);
        montanasLejanas.fillStyle(0x1e5338, 0.92);
        const puntosMontanas = [{ x: 0, y: 520 }];
        for (let x = 0; x <= this.mundoAncho + 1000; x += 180) {
            const h = 260 + Math.sin(x * 0.003) * 110 + Math.cos(x * 0.007) * 40;
            puntosMontanas.push({ x: x, y: h });
        }
        puntosMontanas.push({ x: this.mundoAncho + 1000, y: this.mundoAlto });
        puntosMontanas.push({ x: 0, y: this.mundoAlto });
        montanasLejanas.fillPoints(puntosMontanas, true);

        // Capa 2: Colinas medias
        const colinasMedias = this.add.graphics().setScrollFactor(0.2);
        colinasMedias.fillStyle(0x226240, 0.95);
        const puntosColinas = [{ x: 0, y: 560 }];
        for (let x = 0; x <= this.mundoAncho + 600; x += 140) {
            const h = 380 + Math.sin(x * 0.004) * 80;
            puntosColinas.push({ x: x, y: h });
        }
        puntosColinas.push({ x: this.mundoAncho + 600, y: this.mundoAlto });
        puntosColinas.push({ x: 0, y: this.mundoAlto });
        colinasMedias.fillPoints(puntosColinas, true);

        for (let x = 100; x <= this.mundoAncho; x += 160) {
            const colinaY = 380 + Math.sin(x * 0.004) * 80;
            this.add.image(x, colinaY + 10, 'arbol')
                .setScrollFactor(0.2)
                .setOrigin(0.5, 1)
                .setDisplaySize(120, 160)
                .setTint(0x194d32)
                .setAlpha(0.88);
        }

        // Capa de neblina blanca selvática
        this.neblina = this.add.graphics().setScrollFactor(0.35).setAlpha(0.35);
        this.neblina.fillStyle(0xf1f5f9, 1);
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
                .setScale(0.16)
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
     * PLATAFORMAS Y SUELO (ILUSTRACIÓN CROSS-SECTION DE CAPAS DE LA TIERRA A LO LARGO DE TODO EL NIVEL)
     * ------------------------------------------------------------- */
    _crearPlataformasYSuelo() {
        this.plataformas = this.physics.add.staticGroup();

        // TEXTURA DE SUELO LITOSFERA (210PX DE ALTO PARA MOSTRAR TODAS LAS CAPAS)
        if (!this.textures.exists('textura-suelo-litosfera')) {
            const sueloG = this.make.graphics({ x: 0, y: 0, add: false });
            const w = 600;
            const h = 210;

            // 1. Corteza (Crust 0 - 100 km): 0px a 38px
            sueloG.fillStyle(0x3d2817, 1);
            sueloG.fillRect(0, 0, w, 38);
            sueloG.fillStyle(0x22c55e, 1);
            sueloG.fillRect(0, 0, w, 9); // Pasto verde superior
            sueloG.fillStyle(0x15803d, 1);
            for (let i = 0; i < w; i += 12) sueloG.fillRect(i, 0, 6, 5);

            // 2. Astenosfera (Asthenosphere 100 - 410 km): 38px a 77px
            sueloG.fillStyle(0x9a3412, 1);
            sueloG.fillRect(0, 38, w, 39);
            sueloG.fillStyle(0xc2410c, 1);
            for (let i = 0; i < w; i += 30) {
                sueloG.fillTriangle(i, 38, i + 15, 50, i + 30, 38);
            }

            // 3. Manto (Mantle 100 - 2,900 km): 77px a 117px
            sueloG.fillStyle(0xd97706, 1);
            sueloG.fillRect(0, 77, w, 40);
            sueloG.fillStyle(0xeab308, 0.75);
            for (let i = 0; i < w; i += 40) {
                sueloG.fillRect(i, 86, 24, 6);
            }

            // 4. Núcleo Externo (Outer Core 2,900 - 5,100 km): 117px a 157px
            sueloG.fillStyle(0xea580c, 1);
            sueloG.fillRect(0, 117, w, 40);
            sueloG.fillStyle(0xfb923c, 0.85);
            for (let i = 0; i < w; i += 50) {
                sueloG.fillCircle(i + 25, 137, 9);
            }

            // 5. Núcleo Interno (Inner Core 5,100 - 6,378 km): 157px a 210px
            sueloG.fillStyle(0xfacc15, 1);
            sueloG.fillRect(0, 157, w, 53);
            sueloG.fillStyle(0xfef08a, 1);
            for (let i = 0; i < w; i += 20) {
                sueloG.fillRect(i, 157, 10, 53);
            }

            // Líneas divisoras delgadas entre capas
            sueloG.lineStyle(2, 0xffffff, 0.5);
            sueloG.lineBetween(0, 38, w, 38);
            sueloG.lineBetween(0, 77, w, 77);
            sueloG.lineBetween(0, 117, w, 117);
            sueloG.lineBetween(0, 157, w, 157);

            sueloG.generateTexture('textura-suelo-litosfera', w, h);
            sueloG.destroy();
        }

        // Crear los tiles de suelo a lo largo de todo el ancho del mundo (4200px)
        for (let x = 300; x <= this.mundoAncho + 300; x += 600) {
            const tile = this.plataformas.create(x, this.mundoAlto - 105, 'textura-suelo-litosfera');
            tile.refreshBody();
            tile.setDepth(3);
        }

        // ETIQUETAS VISUALES ESPACIOSAS DE LAS 5 CAPAS EN EL SUELO A LO LARGO DE LA ESCENA
        for (let x = 320; x < this.mundoAncho; x += 750) {
            // Label Corteza
            this.add.text(x, this.sueloY + 13, '⛰️ CORTEZA (0 - 100 km)', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 6, y: 2 }
            }).setDepth(4);

            // Label Astenosfera
            this.add.text(x + 140, this.sueloY + 50, '🔥 ASTENOSFERA (100 - 410 km)', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#fdba74',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 6, y: 2 }
            }).setDepth(4);

            // Label Manto
            this.add.text(x + 300, this.sueloY + 90, '🌋 MANTO (100 - 2,900 km)', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#fef08a',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 6, y: 2 }
            }).setDepth(4);

            // Label Núcleo Externo
            this.add.text(x + 460, this.sueloY + 130, '🌊 NÚCLEO EXTERNO (2,900 - 5,100 km)', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffedd5',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 6, y: 2 }
            }).setDepth(4);

            // Label Núcleo Interno (CLARAMENTE VISIBLE Y DESTACADO)
            this.add.text(x + 220, this.sueloY + 170, '⚡ NÚCLEO INTERNO (5,100 - 6,378 km)', {
                fontSize: '11px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#451a03',
                backgroundColor: 'rgba(254, 240, 138, 0.95)',
                padding: { x: 8, y: 3 }
            }).setDepth(4);
        }

        // Rocas y arbustos decorativos en la superficie
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
        // RAMAS O SUELO FLOTANTE
        const coordsRamas = [
            { x: 740, y: 580, w: 160 },
            { x: 920, y: 490, w: 160 },
            { x: 1000, y: 390, w: 160 }, // Rama del Quetzal
            { x: 1950, y: 570, w: 160 },
            { x: 2180, y: 470, w: 160 }, // Rama del Mono
            { x: 3000, y: 575, w: 160 },
            { x: 3220, y: 490, w: 160 }
        ];

        coordsRamas.forEach(r => {
            const rama = this.plataformas.create(r.x, r.y, 'textura-rama');
            rama.setDisplaySize(r.w, 24);
            rama.body.setSize(r.w, 24);
            rama.refreshBody();
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
     * CAPAS DE LA TIERRA (LITOSFERA - INFOGRAFÍA INTERACTIVA)
     * ------------------------------------------------------------- */
    _crearCapasDeLaTierra() {
        const cx = 1450;
        const groundY = this.sueloY; // 660
        const container = this.add.container(cx, groundY).setDepth(4);
        container.setScale(0.60); // Cartel compacto y elegante

        const baseY = -30;

        // Patas de soporte de madera/metal
        const patasCartel = this.add.graphics();
        patasCartel.fillStyle(0x271406, 1);
        patasCartel.fillRect(-192, baseY + 10, 20, 45);
        patasCartel.fillRect(172, baseY + 10, 20, 45);
        patasCartel.lineStyle(2, 0x8b5e2e, 1);
        patasCartel.strokeRect(-192, baseY + 10, 20, 45);
        patasCartel.strokeRect(172, baseY + 10, 20, 45);
        container.add(patasCartel);

        // Marco del Cartel Expositivo
        const bgEstrellas = this.add.graphics();
        bgEstrellas.fillStyle(0x3b1e08, 1);
        bgEstrellas.fillRoundedRect(-215, -440, 430, 430, 16);
        bgEstrellas.lineStyle(4, 0xd4a84b, 1);
        bgEstrellas.strokeRoundedRect(-215, -440, 430, 430, 16);

        // Fondo de cristal cósmico
        bgEstrellas.fillStyle(0x0c1e38, 0.98);
        bgEstrellas.fillRoundedRect(-202, -428, 404, 406, 12);
        bgEstrellas.lineStyle(2, 0x38bdf8, 0.85);
        bgEstrellas.strokeRoundedRect(-202, -428, 404, 406, 12);

        // Remaches dorados
        const esquinasCartel = [
            [-195, -420], [195, -420],
            [-195, -30], [195, -30]
        ];
        esquinasCartel.forEach(([sx, sy]) => {
            bgEstrellas.fillStyle(0xd4a84b, 1);
            bgEstrellas.fillCircle(sx, sy, 5);
        });

        // Estrellas en el cartel
        for (let i = 0; i < 30; i++) {
            const sx = -190 + Math.random() * 380;
            const sy = -410 + Math.random() * 370;
            bgEstrellas.fillStyle(0xffffff, 0.4 + Math.random() * 0.6);
            bgEstrellas.fillCircle(sx, sy, Math.random() > 0.7 ? 2 : 1);
        }
        container.add(bgEstrellas);

        // Título del Cartel Informativo
        const tituloLitosfera = this.add.text(0, -408, 'LITHOSPHERE', {
            fontSize: '22px',
            fontFamily: '"Press Start 2P", Arial',
            fontStyle: '900',
            color: '#f97316',
            stroke: '#7c2d12',
            strokeThickness: 5
        }).setOrigin(0.5);
        container.add(tituloLitosfera);

        const subtituloLitosfera = this.add.text(0, -384, '📌 CARTEL EXPOSITIVO: ESTRUCTURA DE LA TIERRA', {
            fontSize: '10px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fdba74'
        }).setOrigin(0.5);
        container.add(subtituloLitosfera);

        // REBANADA TRIDIMENSIONAL DE LA TIERRA
        const gWedge = this.add.graphics();

        // 1. Núcleo Interno (Inner Core): 5100 - 6378 km
        gWedge.fillStyle(0xfff500, 1);
        gWedge.fillTriangle(-25, baseY - 55, 25, baseY - 55, 0, baseY);

        // 2. Núcleo Externo (Outer Core): 2900 - 5100 km
        gWedge.fillStyle(0xf97316, 1);
        gWedge.beginPath();
        gWedge.moveTo(-70, baseY - 135);
        gWedge.lineTo(70, baseY - 135);
        gWedge.lineTo(25, baseY - 55);
        gWedge.lineTo(-25, baseY - 55);
        gWedge.closePath();
        gWedge.fillPath();

        gWedge.lineStyle(2, 0xfcb316, 0.75);
        gWedge.beginPath();
        gWedge.moveTo(-50, baseY - 110);
        gWedge.lineTo(50, baseY - 110);
        gWedge.moveTo(-35, baseY - 85);
        gWedge.lineTo(35, baseY - 85);
        gWedge.strokePath();

        // 3. Manto (Mantle): 100 - 2900 km
        gWedge.fillStyle(0xeab308, 1);
        gWedge.beginPath();
        gWedge.moveTo(-120, baseY - 220);
        gWedge.lineTo(120, baseY - 220);
        gWedge.lineTo(70, baseY - 135);
        gWedge.lineTo(-70, baseY - 135);
        gWedge.closePath();
        gWedge.fillPath();

        // 4. Astenosfera (Asthenosphere): 100 - 410 km
        gWedge.fillStyle(0xc2410c, 1);
        gWedge.beginPath();
        gWedge.moveTo(-145, baseY - 260);
        gWedge.lineTo(145, baseY - 260);
        gWedge.lineTo(120, baseY - 220);
        gWedge.lineTo(-120, baseY - 220);
        gWedge.closePath();
        gWedge.fillPath();

        // 5. Corteza (Crust): 0 - 100 km
        gWedge.fillStyle(0x3b82f6, 1);
        gWedge.beginPath();
        gWedge.moveTo(-160, baseY - 280);
        gWedge.lineTo(160, baseY - 280);
        gWedge.lineTo(145, baseY - 260);
        gWedge.lineTo(-145, baseY - 260);
        gWedge.closePath();
        gWedge.fillPath();

        gWedge.fillStyle(0x22c55e, 1);
        gWedge.beginPath();
        gWedge.moveTo(-160, baseY - 280);
        gWedge.lineTo(40, baseY - 286);
        gWedge.lineTo(40, baseY - 276);
        gWedge.lineTo(-160, baseY - 274);
        gWedge.closePath();
        gWedge.fillPath();

        // Montañas y pinos
        const montanasCorteza = this.add.graphics();
        montanasCorteza.fillStyle(0x475569, 1);
        montanasCorteza.fillTriangle(-110, baseY - 280, -60, baseY - 330, -20, baseY - 280);
        montanasCorteza.fillStyle(0x334155, 1);
        montanasCorteza.fillTriangle(-65, baseY - 280, -20, baseY - 345, 20, baseY - 280);

        montanasCorteza.fillStyle(0x15803d, 1);
        montanasCorteza.fillTriangle(-140, baseY - 280, -130, baseY - 315, -120, baseY - 280);
        montanasCorteza.fillTriangle(-125, baseY - 280, -115, baseY - 325, -105, baseY - 280);
        montanasCorteza.fillTriangle(50, baseY - 285, 60, baseY - 320, 70, baseY - 285);
        montanasCorteza.fillTriangle(70, baseY - 285, 80, baseY - 330, 90, baseY - 285);
        container.add(montanasCorteza);
        container.add(gWedge);

        // LÍNEAS INDICADORAS Y ETIQUETAS CON SUS KILÓMETROS
        const gLineas = this.add.graphics();
        gLineas.lineStyle(2, 0xffffff, 0.95);

        // 1. Crust
        gLineas.beginPath();
        gLineas.moveTo(-175, baseY - 275);
        gLineas.lineTo(-120, baseY - 275);
        gLineas.strokePath();
        gLineas.fillStyle(0xffffff, 1);
        gLineas.fillCircle(-120, baseY - 275, 5);

        const txtCorteza = this.add.text(-182, baseY - 290, 'Crust\n0-100 km', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0.5);
        container.add(txtCorteza);

        // 2. Asthenosphere
        const txtAstenosfera = this.add.text(10, baseY - 240, 'Asthenosphere', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        container.add(txtAstenosfera);

        // 3. Mantle
        gLineas.beginPath();
        gLineas.moveTo(-175, baseY - 180);
        gLineas.lineTo(-10, baseY - 180);
        gLineas.strokePath();
        gLineas.fillCircle(-10, baseY - 180, 5);

        const txtManto = this.add.text(-182, baseY - 180, 'Mantle\n2900 km', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0.5);
        container.add(txtManto);

        // 4. Outer Core
        gLineas.beginPath();
        gLineas.moveTo(-175, baseY - 95);
        gLineas.lineTo(-5, baseY - 95);
        gLineas.strokePath();
        gLineas.fillCircle(-5, baseY - 95, 5);

        const txtNucleoExt = this.add.text(-182, baseY - 95, 'Outer Core\n5100 km', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff',
            align: 'right'
        }).setOrigin(1, 0.5);
        container.add(txtNucleoExt);

        // 5. Inner Core
        gLineas.beginPath();
        gLineas.moveTo(-175, baseY);
        gLineas.lineTo(0, baseY);
        gLineas.strokePath();
        gLineas.fillCircle(0, baseY, 6);

        const txtNucleoInt = this.add.text(-182, baseY, 'Inner Core\n6378 km', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fff500',
            align: 'right'
        }).setOrigin(1, 0.5);
        container.add(txtNucleoInt);
        container.add(gLineas);

        // Pedestal interactivo al pie del cartel
        const pedestal = this.add.graphics();
        pedestal.fillStyle(0x0f172a, 1);
        pedestal.fillRoundedRect(-110, baseY + 18, 220, 28, 6);
        pedestal.lineStyle(1.5, 0x38bdf8, 1);
        pedestal.strokeRoundedRect(-110, baseY + 18, 220, 28, 6);
        container.add(pedestal);

        const txtPedestal = this.add.text(0, baseY + 32, '🔍 EXAMINAR [ENTER]', {
            fontSize: '11px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0.5);
        container.add(txtPedestal);

        // Zona interactiva física para aproximación del avatar
        this.capasZona = this.add.zone(cx, groundY - 60, 240, 180);
        this.physics.add.existing(this.capasZona, true);
    }

    _mostrarModalCapasTierra() {
        if (this.modalCapasAbierto) return;
        this.modalCapasAbierto = true;

        const modalContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(40);

        const bgOverlay = this.add.rectangle(500, 400, 1000, 800, 0x000000, 0.78).setInteractive();
        modalContainer.add(bgOverlay);

        const panel = this.add.graphics();
        panel.fillStyle(0x0f172a, 0.98);
        panel.fillRoundedRect(90, 60, 820, 680, 16);
        panel.lineStyle(3, 0x38bdf8, 1);
        panel.strokeRoundedRect(90, 60, 820, 680, 16);
        modalContainer.add(panel);

        const txtTitulo = this.add.text(500, 95, '🌍 LITOSFERA Y CAPAS DE LA TIERRA', {
            fontSize: '22px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#38bdf8'
        }).setOrigin(0.5);
        modalContainer.add(txtTitulo);

        const txtSubtitulo = this.add.text(500, 124, 'Estructura geológica desde la superficie terrestre hasta el centro del planeta', {
            fontSize: '13px',
            fontFamily: 'Arial',
            color: '#94a3b8'
        }).setOrigin(0.5);
        modalContainer.add(txtSubtitulo);

        const capasInfo = [
            {
                nombre: '1. CORTEZA (Crust)',
                rango: '0 — 100 km',
                color: '#22c55e',
                bg: '#14532d',
                desc: 'Capa sólida exterior donde se desarrollan los continentes y los fondos oceánicos. Su grosor varía de 5 km en océanos a 70 km bajo cordilleras.'
            },
            {
                nombre: '2. ASTENOSFERA (Asthenosphere)',
                rango: '100 — 410 km',
                color: '#f97316',
                bg: '#7c2d12',
                desc: 'Zona plástica y dúctil del manto superior sobre la cual navegan lentamente las placas tectónicas, originando volcanes y sismos.'
            },
            {
                nombre: '3. MANTO (Mantle)',
                rango: '100 — 2,900 km',
                color: '#eab308',
                bg: '#713f12',
                desc: 'Representa cerca del 84% del volumen terrestre. Compuesto de rocas silicatadas densas ricas en hierro y magnesio a altas temperaturas.'
            },
            {
                nombre: '4. NÚCLEO EXTERNO (Outer Core)',
                rango: '2,900 — 5,100 km',
                color: '#fb923c',
                bg: '#9a3412',
                desc: 'Capa líquida de hierro y níquel en constante movimiento convectivo. Genera el campo magnético protector de la Tierra.'
            },
            {
                nombre: '5. NÚCLEO INTERNO (Inner Core)',
                rango: '5,100 — 6,378 km',
                color: '#fef08a',
                bg: '#854d0e',
                desc: 'Esfera metálica sólida en el centro del planeta. Sometida a presiones inmensas y temperaturas extremas superiores a los 5,400 °C.'
            }
        ];

        capasInfo.forEach((c, idx) => {
            const cardY = 160 + idx * 105;

            const cG = this.add.graphics();
            cG.fillStyle(Phaser.Display.Color.HexStringToColor(c.bg).color, 0.45);
            cG.fillRoundedRect(120, cardY, 760, 92, 10);
            cG.lineStyle(1.5, Phaser.Display.Color.HexStringToColor(c.color).color, 0.85);
            cG.strokeRoundedRect(120, cardY, 760, 92, 10);
            modalContainer.add(cG);

            const tNombre = this.add.text(140, cardY + 12, c.nombre, {
                fontSize: '16px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: c.color
            });

            const tRango = this.add.text(860, cardY + 12, `PROFUNDIDAD: ${c.rango}`, {
                fontSize: '13px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 8, y: 4 }
            }).setOrigin(1, 0);

            const tDesc = this.add.text(140, cardY + 40, c.desc, {
                fontSize: '12px',
                fontFamily: 'Arial',
                color: '#e2e8f0',
                wordWrap: { width: 720 }
            });

            modalContainer.add([tNombre, tRango, tDesc]);
        });

        const btnCerrar = this.add.container(500, 705);
        const bgBtn = this.add.graphics();
        bgBtn.fillStyle(0xef4444, 1);
        bgBtn.fillRoundedRect(-110, -18, 220, 36, 8);
        const txtBtn = this.add.text(0, 0, 'CERRAR [ENTER / ESC]', {
            fontSize: '13px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5);
        btnCerrar.add([bgBtn, txtBtn]);
        btnCerrar.setSize(220, 36);
        btnCerrar.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => cerrarModal());
        modalContainer.add(btnCerrar);

        // Cooldown: esperar al menos 350ms antes de permitir cerrar con teclado,
        // para que el ENTER que abrió el modal no lo cierre inmediatamente.
        let puedecerrarse = false;
        this.time.delayedCall(350, () => { puedecerrarse = true; });

        const cerrarModal = () => {
            if (!puedecerrarse) return;
            if (this._cerrandoModal) return;
            this._cerrandoModal = true;
            if (this._modalCapasUpdater) {
                this.events.off('postupdate', this._modalCapasUpdater);
                this._modalCapasUpdater = null;
            }
            modalContainer.destroy();
            this.modalCapasAbierto = false;
            this._cerrandoModal = false;
        };

        // Escuchar ESC con el sistema de keys de Phaser (no compite con JustDown)
        const escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

        // Polling de ENTER/ESC en postupdate (se ejecuta DESPUÉS del update, evitando conflictos)
        this._modalCapasUpdater = () => {
            if (!puedecerrarse) return;
            if (Phaser.Input.Keyboard.JustDown(this.teclaEnter) ||
                Phaser.Input.Keyboard.JustDown(escKey)) {
                cerrarModal();
            }
        };
        this.events.on('postupdate', this._modalCapasUpdater);
    }

    /* -------------------------------------------------------------
     * JUGADOR
     * ------------------------------------------------------------- */
    _crearAnimacionesJugador() {
        const key = this.avatarKey;
        const avatarTexKey = `avatar-${key}`;

        // Remover animaciones existentes para garantizar la correcta sincronización con EscenaJuego
        if (this.anims.exists(`caminar-der-${key}`)) this.anims.remove(`caminar-der-${key}`);
        if (this.anims.exists(`caminar-izq-${key}`)) this.anims.remove(`caminar-izq-${key}`);
        if (this.anims.exists(`quieto-der-${key}`)) this.anims.remove(`quieto-der-${key}`);
        if (this.anims.exists(`quieto-izq-${key}`)) this.anims.remove(`quieto-izq-${key}`);
        if (this.anims.exists(`quieto-${key}`)) this.anims.remove(`quieto-${key}`);

        // Mapeo idéntico al spritesheet 64x64 de EscenaJuego:
        // Fila 0 (frames 0-3): Abajo / Frente
        // Fila 1 (frames 4-7): Arriba / Espalda
        // Fila 2 (frames 8-11): Izquierda
        // Fila 3 (frames 12-15): Derecha
        this.anims.create({
            key: `caminar-der-${key}`,
            frames: this.anims.generateFrameNumbers(avatarTexKey, { start: 12, end: 15 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: `caminar-izq-${key}`,
            frames: this.anims.generateFrameNumbers(avatarTexKey, { start: 8, end: 11 }),
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: `quieto-der-${key}`,
            frames: [{ key: avatarTexKey, frame: 12 }],
            frameRate: 1
        });

        this.anims.create({
            key: `quieto-izq-${key}`,
            frames: [{ key: avatarTexKey, frame: 8 }],
            frameRate: 1
        });

        this.anims.create({
            key: `quieto-${key}`,
            frames: [{ key: avatarTexKey, frame: 0 }],
            frameRate: 1
        });
    }

    _crearJugador() {
        const avatarTexKey = `avatar-${this.avatarKey}`;
        this.jugador = this.physics.add.sprite(150, this.sueloY - 40, avatarTexKey, 12);
        this.jugador.setDisplaySize(58, 58);
        this.jugador.body.setSize(38, 52, true);
        this.jugador.setCollideWorldBounds(true);
        this.jugador.setDepth(7);
        this.jugador.direccion = 'derecha';
        this.jugador.play(`quieto-der-${this.avatarKey}`);

        this.physics.add.collider(this.jugador, this.plataformas);
    }

    /* -------------------------------------------------------------
     * FAUNA PACÍFICA DE CHIAPAS (Con Spritesheets Mapeados)
     * ------------------------------------------------------------- */
    _crearFaunaPacifica() {
        // 1. EL QUETZAL (Posado en rama alta con animación de plumaje)
        this.quetzal = this.physics.add.sprite(1160, 344, 'quetzal_volando_raw', 'perch_wings_folded');
        this.quetzal.setScale(0.24);
        this.quetzal.body.setAllowGravity(false);
        this.quetzal.body.setImmovable(true);
        this.quetzal.setDepth(5);
        this.quetzal.play('quetzal-posado');
        this.quetzal.asustado = false;

        // Zona de encuadre fotográfico justo bajo la rama
        this.quetzalFotoZona = this.add.zone(1160, 430, 240, 200);
        this.physics.add.existing(this.quetzalFotoZona, true);

        // Árbol grande y enraizado que sostiene al quetzal
        this.add.image(1160, this.sueloY, 'arbol_grande')
            .setDisplaySize(300, 460)
            .setOrigin(0.5, 1)
            .setDepth(4)
            .setAlpha(0.95);

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
        this.jaguar = this.physics.add.sprite(3600, this.sueloY - 40, 'jaguar_raw', 'run_0');
        this.jaguar.setScale(0.23);
        this.jaguar.body.setSize(340, 170);
        this.jaguar.body.setOffset(60, 95);
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

        this.textoEstacionInfo = this.add.text(finX, this.sueloY - 115, '🏆 META DE EXPEDICIÓN\nDocumenta las 7 especies de la selva', {
            fontSize: '11px',
            fontFamily: 'Arial',
            color: '#dcedc8',
            align: 'center'
        }).setOrigin(0.5).setDepth(5);

        // Botón interactivo para finalizar expedición directamente en la estación
        this.btnFinalizarEstacion = this.add.container(finX, this.sueloY - 50).setDepth(6).setVisible(false);
        const bgBtnFin = this.add.graphics();
        bgBtnFin.fillStyle(0x15803d, 1);
        bgBtnFin.fillRoundedRect(-115, -18, 230, 36, 8);
        bgBtnFin.lineStyle(2, 0xfacc15, 1);
        bgBtnFin.strokeRoundedRect(-115, -18, 230, 36, 8);
        const txtBtnFin = this.add.text(0, 0, '🏆 FINALIZAR EXPEDICIÓN', {
            fontSize: '12px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#fef08a'
        }).setOrigin(0.5);
        this.btnFinalizarEstacion.add([bgBtnFin, txtBtnFin]);
        this.btnFinalizarEstacion.setSize(230, 36);
        this.btnFinalizarEstacion.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this._alternarModalBitacora())
            .on('pointerover', () => this.btnFinalizarEstacion.setScale(1.05))
            .on('pointerout', () => this.btnFinalizarEstacion.setScale(1.0));

        this.tweens.add({
            targets: this.btnFinalizarEstacion,
            scale: 1.04,
            yoyo: true,
            repeat: -1,
            duration: 900,
            ease: 'Sine.InOut'
        });

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
        promptBG.fillRoundedRect(-240, -22, 480, 44, 10);
        promptBG.lineStyle(2, 0xa7f3d0, 1);
        promptBG.strokeRoundedRect(-240, -22, 480, 44, 10);
        this.promptTexto = this.add.text(0, 0, '📷 Presiona [ENTER / E / ACEPTAR] para tomar FOTO', {
            fontSize: '14px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            color: '#ecfdf5'
        }).setOrigin(0.5);
        this.promptAccion.add([promptBG, this.promptTexto]);
        this.promptAccion.setSize(480, 44);
        this.promptAccion.setInteractive({ useHandCursor: true })
            .on('pointerdown', () => {
                if (this._callbackPromptAccion) this._callbackPromptAccion();
            });

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
            if (det.id === 'quetzal') imgEspecie.setDisplaySize(120, 125);
            else if (det.id === 'tapir') imgEspecie.setDisplaySize(160, 110);
            else if (det.id === 'mono') imgEspecie.setDisplaySize(110, 110);
            else if (det.id === 'pecari') imgEspecie.setDisplaySize(140, 100);
            else if (det.id === 'jaguar') imgEspecie.setDisplaySize(100, 135);
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

        // Si la bitácora está completa (7/7), mostrar botón de Finalizar Expedición
        const totalReg = Object.values(this.bitacora).filter(e => e.registrada).length;
        if (totalReg >= Object.values(this.bitacora).length) {
            const btnFinB = this.add.container(215, 230);
            const bgFinB = this.add.graphics();
            bgFinB.fillStyle(0xd97706, 1);
            bgFinB.fillRoundedRect(-145, -19, 290, 38, 10);
            bgFinB.lineStyle(2, 0xfef08a, 1);
            bgFinB.strokeRoundedRect(-145, -19, 290, 38, 10);

            const txtFinB = this.add.text(0, 0, '🏆 FINALIZAR EXPEDICIÓN [ENTER]', {
                fontSize: '13px',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                color: '#ffffff'
            }).setOrigin(0.5);

            btnFinB.add([bgFinB, txtFinB]);
            btnFinB.setSize(290, 38);
            btnFinB.setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    this._removerListenerBitacora();
                    this._alternarModalBitacora();
                    this._finalizarExpedicionDirecta();
                })
                .on('pointerover', () => btnFinB.setScale(1.04))
                .on('pointerout', () => btnFinB.setScale(1.0));

            this.elementosDetalleBitacora.add(btnFinB);
        }
    }

    _removerListenerBitacora() {
        if (this._listenerTecladoBitacora) {
            this.events.off('postupdate', this._listenerTecladoBitacora);
            this._listenerTecladoBitacora = null;
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

            // Permitir finalizar con ENTER cuando la bitácora esté completa
            const totalReg = Object.values(this.bitacora).filter(e => e.registrada).length;
            const bitacoraCompleta = totalReg >= Object.values(this.bitacora).length;

            this._removerListenerBitacora();

            let puedeInteractuarTeclado = false;
            this.time.delayedCall(200, () => { puedeInteractuarTeclado = true; });

            this._listenerTecladoBitacora = () => {
                if (!this.modalBitacoraAbierto) return;
                if (!puedeInteractuarTeclado) return;

                if (bitacoraCompleta && (
                    Phaser.Input.Keyboard.JustDown(this.teclaEnter) ||
                    Phaser.Input.Keyboard.JustDown(this.teclaE) ||
                    (window.mobileControls && window.mobileControls.consume('enter'))
                )) {
                    this._removerListenerBitacora();
                    this._alternarModalBitacora();
                    this._finalizarExpedicionDirecta();
                } else if (
                    Phaser.Input.Keyboard.JustDown(this.teclaESC) ||
                    Phaser.Input.Keyboard.JustDown(this.teclaB) ||
                    (window.mobileControls && window.mobileControls.consume('escape'))
                ) {
                    this._removerListenerBitacora();
                    this._alternarModalBitacora();
                }
            };
            this.events.on('postupdate', this._listenerTecladoBitacora);
        } else {
            this._removerListenerBitacora();
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

        if (this.modalCapasAbierto) {
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

        // Modo Agachado / Sigilo (sin alterar el hitbox físico para evitar atravesar el suelo)
        if (agachar && enSuelo) {
            if (!this.agachado) {
                this.agachado = true;
                this.jugador.setTint(0x86efac);
                this.jugador.setAlpha(0.8);
            }
        } else if (!agachar && this.agachado) {
            this.agachado = false;
            this.jugador.clearTint();
            this.jugador.setAlpha(1);
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
            if (this.jugador.direccion === 'izquierda') {
                this.jugador.play(`quieto-izq-${this.avatarKey}`, true);
            } else if (this.jugador.direccion === 'derecha') {
                this.jugador.play(`quieto-der-${this.avatarKey}`, true);
            } else {
                this.jugador.play(`quieto-${this.avatarKey}`, true);
            }
        }

        if (saltar && enSuelo) {
            if (this.agachado) {
                this.agachado = false;
                this.jugador.clearTint();
                this.jugador.setAlpha(1);
            }
            this.jugador.setVelocityY(-540);
            this._reproducirSonido('salto');
        }
    }

    _actualizarBiodiversidadViva(time) {
        if (this.nubesSky) {
            this.nubesSky.forEach(nube => {
                nube.x += (nube.speed || 0.8) * 0.4;
                if (nube.x > this.mundoAncho + 250) {
                    nube.x = -200;
                }
            });
        }

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
        // 0. QUETZAL — huye al acercarse el jugador (rango más corto: 120px normal, 60px con sigilo agachado)
        if (this.quetzal && !this.quetzal.asustado) {
            const distQuetzal = Phaser.Math.Distance.Between(
                this.jugador.x, this.jugador.y,
                this.quetzal.x, this.quetzal.y
            );
            const rangoDeteccion = this.agachado ? 60 : 120;
            if (distQuetzal < rangoDeteccion) {
                this.quetzal.asustado = true;
                this.quetzal.play('quetzal-vuelo', true);
                this.quetzal.body.setAllowGravity(false);

                // Ícono de susto
                const alertaQ = this.add.text(this.quetzal.x, this.quetzal.y - 50, '🐦💨', {
                    fontSize: '22px'
                }).setOrigin(0.5).setDepth(9);
                this.tweens.add({
                    targets: alertaQ,
                    y: this.quetzal.y - 90,
                    alpha: 0,
                    duration: 800,
                    onComplete: () => alertaQ.destroy()
                });

                // Vuelo hacia la derecha y arriba más lento y majestuoso
                this.tweens.add({
                    targets: this.quetzal,
                    x: this.quetzal.x + 550,
                    y: this.quetzal.y - 170,
                    alpha: 0,
                    duration: 3500,
                    ease: 'Sine.Out',
                    onComplete: () => {
                        this.quetzal.setVisible(false);

                        // Quetzal regresa al árbol después de 2 segundos
                        this.time.delayedCall(3000, () => {
                            if (!this.quetzal || !this.quetzal.active) return;
                            // Reposicionar arriba del árbol y descender suavemente
                            this.quetzal.setPosition(1160, 260);
                            this.quetzal.setAlpha(0);
                            this.quetzal.setVisible(true);
                            this.quetzal.play('quetzal-vuelo', true);

                            this.tweens.add({ // Efecto de que vuele hacia abajo (Regresa al árbol)
                                targets: this.quetzal,
                                y: 344,
                                alpha: 1,
                                duration: 1500,
                                ease: 'Sine.Out',
                                onComplete: () => {
                                    this.quetzal.play('quetzal-posado', true);
                                    this.quetzal.asustado = false;
                                    this._mostrarNotificacion('🐦 ¡El Quetzal regresó al árbol! Ya puedes fotografiarlo', '#86efac', 2800);
                                }
                            });
                        });
                    }
                });

                this._mostrarNotificacion('🐦 ¡El Quetzal salió volando! Acércate con más sigilo [ABAJO / S]', '#fef08a', 3000);
            }
        }

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
            if (this.quetzal.asustado) {
                // Quetzal huyó — mostrar aviso pero no permitir foto
                puedeInteractuar = true;
                mensajeAccion = '🐦 El Quetzal huyó... Espera a que regrese al árbol';
            } else {
                puedeInteractuar = true;
                mensajeAccion = '📷 Presiona [ENTER / E] para fotografiar al Quetzal';
                if (accionPresionada) {
                    this._tomarFotoEspecie('quetzal');
                    return;
                }
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

        // 6. Capas de la Tierra (Litosfera)
        if (this.physics.overlap(this.jugador, this.capasZona)) {
            puedeInteractuar = true;
            mensajeAccion = '🌍 Presiona [ENTER / E] para examinar Cartel de la Litosfera';
            if (accionPresionada) {
                this._mostrarModalCapasTierra();
                return;
            }
        }

        // 7. Estación Final (Zona amplia: desde x=3800 hasta el final del mapa)
        const enEstacion = (this.jugador.x >= 3800) || (this.estacionZona && this.physics.overlap(this.jugador, this.estacionZona));
        if (enEstacion) {
            const totalRegistradas = Object.values(this.bitacora).filter(e => e.registrada).length;
            const totalEspecies = Object.values(this.bitacora).length;
            const bitacoraCompleta = totalRegistradas >= totalEspecies;

            if (bitacoraCompleta) {
                if (this.btnFinalizarEstacion) this.btnFinalizarEstacion.setVisible(true);
                puedeInteractuar = true;
                mensajeAccion = '🏆 ¡EXPEDICIÓN COMPLETA (7/7)! Presiona [ENTER / E] para REVISAR LOGROS Y FINALIZAR';
                this._callbackPromptAccion = () => this._alternarModalBitacora();
                if (accionPresionada) {
                    this._alternarModalBitacora();
                    return;
                }
            } else {
                puedeInteractuar = true;
                mensajeAccion = `📋 Estación Biológica: Bitácora incompleta (${totalRegistradas}/${totalEspecies} especies). Presiona [ENTER] para revisar`;
                this._callbackPromptAccion = () => this._alternarModalBitacora();
                if (accionPresionada) {
                    this._alternarModalBitacora();
                    return;
                }
            }
        }

        if (puedeInteractuar) {
            this.promptTexto.setText(mensajeAccion);
            this.promptAccion.setVisible(true);
        } else {
            this._callbackPromptAccion = null;
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
            this.jugador.clearTint();
            this.jugador.setAlpha(1);
            this.jugador.setPosition(150, this.sueloY - 40);
            this.jugador.setVelocity(0, 0);
            this.jugador.direccion = 'derecha';
            this.jugador.play(`quieto-der-${this.avatarKey}`, true);
            this.cameras.main.fadeIn(500, 0, 0, 0);
            this.invulnerable = false;
        });
    }

    _actualizarContadorHUD() {
        const total = Object.values(this.bitacora).filter(e => e.registrada).length;
        const totalMax = Object.values(this.bitacora).length;
        this.textoContadorEspecies.setText(`📓 ESPECIES: ${total} / ${totalMax}`);

        if (total >= totalMax) {
            if (this.btnFinalizarEstacion) this.btnFinalizarEstacion.setVisible(true);
            if (this.textoEstacionInfo) {
                this.textoEstacionInfo.setText('⭐ ¡BITÁCORA COMPLETA (7/7)!\nHaz clic en FINALIZAR EXPEDICIÓN');
                this.textoEstacionInfo.setColor('#fef08a');
            }
        }
    }

    _finalizarExpedicionDirecta() {
        if (this._transitando) return;
        this._transitando = true;

        if (this.modalBitacoraAbierto) {
            this.contenedorBitacora.setVisible(false);
            this.modalBitacoraAbierto = false;
        }

        this._reproducirSonido('foto');
        this._mostrarNotificacion('🏆 ¡Felicidades! Expedición Chiapas completada (7/7). Volviendo al mapa...', '#facc15', 3500);

        this.cameras.main.fadeOut(600, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EscenaJuego', {
                avatarKey: this.avatarKey,
                posInicial: { x: 1400, y: 900 },
                ignoreEscape: true,
                expedicionCompletada: true
            });
        });
    }

    _salirDeSala(completada = false) {
        if (this._transitando) return;
        this._transitando = true;

        if (completada) {
            this._reproducirSonido('foto');
            this._mostrarNotificacion('🏆 ¡Felicidades! Expedición completada con éxito. Volviendo...', '#facc15', 3000);
        }

        this.cameras.main.fadeOut(completada ? 600 : 300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('EscenaJuego', {
                avatarKey: this.avatarKey,
                posInicial: { x: 1400, y: 900 },
                ignoreEscape: true,
                expedicionCompletada: completada
            });
        });
    }
}
