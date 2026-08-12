import makeWASocket, { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Groq } from 'groq-sdk';
import qrcode from 'qrcode-terminal'; // lo volvemos a usar solo para pintar

const GROQ_KEY = process.env.GROQ_KEY;
const groq = new Groq({ apiKey: GROQ_KEY });

async function getIA(texto) {
    const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: `Eres ZYON, bot peruano. Responde corto y con jerga: ${texto}` }]
    });
    return res.choices[0].message.content;
}

async function startBot() {
    const { version } = await fetchLatestBaileysVersion();
    const { state, saveCreds } = await useMultiFileAuthState('auth');

    const sock = makeWASocket({
        version,
        auth: state
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if(qr) {
            console.log('ESCANEA ESTE QR PARA PRENDER ZYON:');
            qrcode.generate(qr, { small: true }); // aquí sale el QR
        }

        if(connection === 'open') {
            console.log('ZYON PRENDIDO 🔥 24/7');
        }

        if(connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode!== DisconnectReason.loggedOut;
            if(shouldReconnect) startBot();
        }
    });

    sock.ev.on('messages.upsert', async ({messages}) => {
        const msg = messages[0];
        if(!msg.message || msg.key.fromMe) return;
        const texto = msg.message.conversation || '';
        if(texto.toLowerCase().includes('zyon')){
            const res = await getIA(texto);
            await sock.sendMessage(msg.key.remoteJid, {text: res});
        }
    });
}
startBot();
