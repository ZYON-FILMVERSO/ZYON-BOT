import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import { Groq } from 'groq-sdk';
import qrcode from 'qrcode-terminal';

const GROQ_KEY = process.env.GROQ_KEY;
if (!GROQ_KEY) {
    console.log('ERROR: Falta GROQ_KEY');
    process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_KEY });

async function getIA(texto) {
    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: `Eres ZYON, un bot de WhatsApp peruano. Responde corto, con jerga peruana y gracioso: ${texto}` }],
            max_tokens: 200
        });
        return res.choices[0].message.content;
    } catch(e) {
        return "Asuu mano me trabe, intenta de nuevo pe";
    }
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr } = update;
        if (qr) {
            console.log('Escanea este QR:');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log('ZYON PRENDIDO 🔥 24/7');
        }
    });

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
        const from = msg.key.remoteJid;
        const lower = texto.toLowerCase();

        if (lower.includes('zyon') || lower.includes('ia') || lower.includes('bot')) {
            const pregunta = texto.replace(/zyon|ia|bot/gi, '').trim();
            const respuesta = await getIA(pregunta);
            await sock.sendMessage(from, { text: respuesta });
        }
    });
}

startBot();
