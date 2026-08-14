// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode');
const { handleIncomingMessage } = require('./ia-peruana');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// Configuración
const PORT = process.env.PORT || 3000;
const SESSION_DIR = process.env.SESSION_DIR || './sessions';
const BOT_NAME = 'ZYON';

// Asegurar directorio de sesiones
if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Estado global
let sock = null;
let qrCode = null;
let isConnected = false;

// Servidor Express
const app = express();
app.use(express.json());

// Endpoint para obtener el QR (lo muestra como imagen)
app.get('/qr', async (req, res) => {
    if (qrCode) {
        try {
            const qrImage = await qrcode.toDataURL(qrCode);
            res.send(`<img src="${qrImage}" alt="QR Code" />`);
        } catch (e) {
            res.status(500).send('Error generando QR');
        }
    } else {
        res.send('Esperando QR... (el bot ya podría estar conectado)');
    }
});

// Health check para mantener activo en Render
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        bot: BOT_NAME,
        connected: isConnected,
        uptime: process.uptime()
    });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
    console.log(`[${BOT_NAME}] Servidor corriendo en puerto ${PORT}`);
});

// Función para iniciar el socket de WhatsApp
async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false, // lo manejamos con Express
        logger: pino({ level: 'silent' }),
        browser: ['ZYON Bot', 'Chrome', '1.0.0']
    });

    // Evento de actualización de credenciales
    sock.ev.on('creds.update', saveCreds);

    // Evento de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCode = qr;
            console.log('[ZYON] Nuevo QR generado. Escanea con WhatsApp.');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            isConnected = false;
            qrCode = null;
            console.log(`[ZYON] Conexión cerrada. Código: ${statusCode}`);
            // Reconectar si no fue cierre intencional
            if (statusCode !== DisconnectReason.loggedOut) {
                console.log('[ZYON] Reconectando en 5 segundos...');
                setTimeout(startSock, 5000);
            } else {
                console.log('[ZYON] Sesión cerrada. Elimina la carpeta sessions y reinicia.');
            }
        }

        if (connection === 'open') {
            isConnected = true;
            qrCode = null;
            console.log(`[${BOT_NAME}] Conectado exitosamente a WhatsApp!`);
        }
    });

    // Evento de mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        // Extraer texto del mensaje
        let text = '';
        if (msg.message.conversation) {
            text = msg.message.conversation;
        } else if (msg.message.extendedTextMessage?.text) {
            text = msg.message.extendedTextMessage.text;
        } else if (msg.message.imageMessage?.caption) {
            text = msg.message.imageMessage.caption;
        } else {
            return; // No es texto
        }

        const sender = msg.key.remoteJid;
        console.log(`[${BOT_NAME}] Mensaje de ${sender}: ${text}`);

        // Procesar con IA peruana
        try {
            const reply = await handleIncomingMessage(text, sender);
            if (reply) {
                await sock.sendMessage(sender, { text: reply });
            }
        } catch (error) {
            console.error('[ZYON] Error al procesar con IA:', error);
            await sock.sendMessage(sender, { text: '❌ Lo siento, mi IA peruana tuvo un problema. Intenta más tarde.' });
        }
    });
}

// Iniciar el bot
startSock();

// Manejo de señales para cerrar limpiamente
process.on('SIGINT', () => {
    console.log(`[${BOT_NAME}] Cerrando...`);
    server.close(() => process.exit(0));
});
