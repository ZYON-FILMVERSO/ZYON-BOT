import makeWASocket from '@whiskeysockets/baileys';
import { useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Groq } from 'groq-sdk';

const GROQ_KEY = process.env.GROQ_KEY;
const groq = new Groq({ apiKey: GROQ_KEY });

async function getIA(texto) {
    const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: `Eres ZYON, bot peruano. Responde corto con jerga: ${texto}` }]
    });
    return res.choices[0].message.content;
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth');
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true // Baileys ya trae su propio QR
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({connection}) => {
        if(connection === 'open') console.log('ZYON PRENDIDO 🔥');
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
