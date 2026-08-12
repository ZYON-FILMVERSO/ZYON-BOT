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
    
    if(process.env.SESSION_DATA) {
        fs.writeFileSync('./auth/creds.json', Buffer.from(process.env.SESSION_DATA, 'base64'));
    }

    const { state, saveCreds } = await useMultiFileAuthState('./auth');
    
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'info' }),
        browser: ['Ubuntu', 'Chrome', '20.0.04'],
        printQRInTerminal: false // DESACTIVAMOS QR
    });

    sock.ev.on('creds.update', saveCreds);
    
    // ESTO PIDE EL CODIGO SOLO 1 VEZ
    if(!sock.authState.creds.registered) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const code = await sock.requestPairingCode(PHONE_NUMBER);
        console.log('🔥 TU CODIGO DE 8 DIGITOS ES:', code);
    }

    sock.ev.on('connection.update', (u) => {
        console.log('Estado:', u.connection);
        if(u.connection === 'open') console.log('✅ ZYON BOT CONECTADO EN RENDER ✅');
    });
}

startZyon();
