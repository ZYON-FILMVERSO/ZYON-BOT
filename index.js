const http = require('http');
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => res.end('Zyon Bot Online')).listen(PORT);
console.log(`Servidor web prendido en puerto ${PORT}`);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const fs = require('fs');
const pino = require('pino');

const PHONE_NUMBER = '51913615315' // TU NUMERO CON CODIGO DE PAIS

async function startZyon() {
    const { version } = await fetchLatestBaileysVersion();
    console.log('Usando WA v:', version);

    if(!fs.existsSync('./auth')) fs.mkdirSync('./auth');

    // CARGAR SESION DESDE VARIABLE SI EXISTE
    if(process.env.SESSION_DATA) {
        fs.writeFileSync('./auth/creds.json', Buffer.from(process.env.SESSION_DATA, 'base64'));
        console.log('Sesion cargada desde SESSION_DATA');
    }

    const { state, saveCreds } = await useMultiFileAuthState('./auth');

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'info' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false
    });

    // PASO 2: GUARDAR SESION EN CONSOLA CADA VEZ QUE CAMBIE
    sock.ev.on('creds.update', async () => {
        saveCreds();
        const creds = fs.readFileSync('./auth/creds.json');
        console.log('🔥🔥 COPIA ESTA SESSION_DATA PARA RENDER 🔥🔥');
        console.log(Buffer.from(creds).toString('base64'));
    });

    // PEDIR CODIGO SOLO SI NO ESTA REGISTRADO
    if(!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log('🔥 TU CODIGO DE 8 DIGITOS ES:', code);
    }

    sock.ev.on('connection.update', (u) => {
        console.log('Estado:', u.connection);
        if(u.connection === 'open') console.log('✅ ZYON BOT CONECTADO EN RENDER CON', PHONE_NUMBER, '✅');
        if(u.connection === 'close' && u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) {
            startZyon();
        }
    });

    // AQUI VA TU CODIGO DE MENSAJES
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if(!m.message || m.key.fromMe) return;

        const text = m.message.conversation || m.message.extendedTextMessage?.text;
        if(text === '.ping') {
            await sock.sendMessage(m.key.remoteJid, { text: 'pong' });
        }
    });
}

startZyon();
