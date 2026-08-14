// index.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const qrcode = require('qrcode');
const { handleIncomingMessage } = require('./ia-peruana');
const pino = require('pino');
const fs = require('fs');
const path = require('path');

// ========== CONFIGURACIÓN ==========
const PORT = process.env.PORT || 3000;
const SESSION_DIR = process.env.SESSION_DIR || './sessions';
const BOT_NAME = 'ZYON';

// Estado global
let sock = null;
let qrCode = null;
let isConnected = false;

// ========== SERVIDOR EXPRESS ==========
const app = express();

// ---------- 1. DASHBOARD PRINCIPAL (LA PÁGINA WEB) ----------
app.get('/', async (req, res) => {
    // Generamos el HTML con estilos modernos y JS para auto-actualización
    const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ZYON - Panel de Control</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', system-ui, sans-serif; }
            body {
                background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                padding: 20px;
            }
            .container {
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.1);
                border-radius: 32px;
                padding: 40px 50px;
                max-width: 550px;
                width: 100%;
                box-shadow: 0 25px 50px rgba(0,0,0,0.5);
                text-align: center;
            }
            .logo {
                font-size: 48px;
                font-weight: 800;
                background: linear-gradient(to right, #f7971e, #ffd200);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 5px;
            }
            .subtitle {
                color: #aaa;
                font-weight: 300;
                letter-spacing: 2px;
                margin-bottom: 30px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                padding-bottom: 15px;
            }
            .status-box {
                background: rgba(0,0,0,0.3);
                border-radius: 16px;
                padding: 15px;
                margin-bottom: 25px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 10px;
            }
            .status-label {
                color: #ccc;
                font-size: 14px;
            }
            .status-badge {
                padding: 6px 18px;
                border-radius: 50px;
                font-weight: 600;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .badge-connected { background: #10b981; color: white; }
            .badge-disconnected { background: #ef4444; color: white; }
            .badge-waiting { background: #f59e0b; color: white; }
            
            .qr-wrapper {
                background: white;
                padding: 20px;
                border-radius: 24px;
                display: inline-block;
                margin: 10px 0 20px 0;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .qr-wrapper img {
                width: 250px;
                height: 250px;
                display: block;
            }
            .qr-placeholder {
                width: 250px;
                height: 250px;
                background: #1a1a2e;
                border-radius: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #555;
                font-size: 14px;
                border: 2px dashed #333;
            }
            .info-ia {
                margin-top: 25px;
                background: rgba(0,0,0,0.2);
                padding: 12px;
                border-radius: 12px;
                font-size: 13px;
                color: #aaa;
            }
            .info-ia span { color: #ffd700; font-weight: 600; }
            .footer {
                margin-top: 30px;
                color: #444;
                font-size: 12px;
                letter-spacing: 1px;
            }
            .refresh-note {
                color: #666;
                font-size: 12px;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">ZYON</div>
            <div class="subtitle">BOT · IA PERUANA</div>

            <!-- Estado de conexión -->
            <div class="status-box">
                <span class="status-label">📡 Estado del Bot</span>
                <span id="statusBadge" class="status-badge badge-waiting">⏳ Cargando...</span>
            </div>

            <!-- Código QR -->
            <div id="qrContainer">
                <div class="qr-wrapper">
                    <div id="qrImageContainer" class="qr-placeholder">
                        ⏳ Esperando QR...
                    </div>
                </div>
            </div>
            <div id="connectedMessage" style="display: none; color: #10b981; font-weight: 600; margin-top: -10px; margin-bottom: 15px;">
                ✅ ¡ZYON ya está conectado! Puedes cerrar esta página.
            </div>

            <!-- Estado de la API Key de la IA -->
            <div class="info-ia">
                🧠 IA Peruana: <span id="iaStatus">Verificando...</span>
            </div>
            <div class="footer">
                🚀 Desplegado en Render · @Elvis_28_
            </div>
            <div class="refresh-note">
                La página se actualiza automáticamente cada 3 segundos.
            </div>
        </div>

        <script>
            // Función para actualizar el estado y el QR
            async function fetchStatus() {
                try {
                    const res = await fetch('/status');
                    const data = await res.json();
                    
                    // Actualizar badge de estado
                    const badge = document.getElementById('statusBadge');
                    const qrContainer = document.getElementById('qrContainer');
                    const connectedMsg = document.getElementById('connectedMessage');
                    const qrImgContainer = document.getElementById('qrImageContainer');

                    if (data.connected) {
                        badge.className = 'status-badge badge-connected';
                        badge.innerText = '✅ Conectado';
                        qrContainer.style.display = 'none';
                        connectedMsg.style.display = 'block';
                    } else {
                        badge.className = 'status-badge badge-disconnected';
                        badge.innerText = '⛔ Desconectado';
                        qrContainer.style.display = 'block';
                        connectedMsg.style.display = 'none';

                        // Si hay QR, mostrarlo
                        if (data.qr) {
                            // Limpiar y poner imagen
                            qrImgContainer.innerHTML = ''; 
                            const img = document.createElement('img');
                            img.src = data.qr; 
                            img.style.width = '250px';
                            img.style.height = '250px';
                            img.style.display = 'block';
                            qrImgContainer.appendChild(img);
                        } else {
                            qrImgContainer.className = 'qr-placeholder';
                            qrImgContainer.innerHTML = '⏳ Generando código QR...';
                        }
                    }

                    // Actualizar estado de la IA
                    const iaSpan = document.getElementById('iaStatus');
                    if (data.iaConfigured) {
                        iaSpan.innerText = '✅ Configurada y activa';
                        iaSpan.style.color = '#10b981';
                    } else {
                        iaSpan.innerText = '⚠️ No configurada (falta API Key)';
                        iaSpan.style.color = '#ef4444';
                    }

                } catch (e) {
                    console.error('Error al obtener estado:', e);
                }
            }

            // Actualizar cada 3 segundos
            fetchStatus();
            setInterval(fetchStatus, 3000);
        </script>
    </body>
    </html>
    `;
    res.send(html);
});

// ---------- 2. ENDPOINT DE ESTADO (API JSON) ----------
app.get('/status', (req, res) => {
    // Verificar si la IA tiene API Key configurada (sin exponer la clave)
    const iaConfigured = !!(process.env.IA_API_KEY && process.env.IA_API_KEY !== 'tu_clave_secreta');
    
    // Si hay QR, lo convertimos a dataURL para mostrarlo en el frontend
    let qrDataUrl = null;
    if (qrCode) {
        try {
            // Generamos la imagen en base64 para mandarla directamente
            qrcode.toDataURL(qrCode, (err, url) => {
                if (!err) qrDataUrl = url;
                res.json({
                    connected: isConnected,
                    qr: qrDataUrl,
                    iaConfigured: iaConfigured,
                    botName: BOT_NAME
                });
            });
        } catch (e) {
            res.json({
                connected: isConnected,
                qr: null,
                iaConfigured: iaConfigured,
                botName: BOT_NAME
            });
        }
    } else {
        res.json({
            connected: isConnected,
            qr: null,
            iaConfigured: iaConfigured,
            botName: BOT_NAME
        });
    }
});

// ---------- 3. HEALTH CHECK (para mantener vivo el bot) ----------
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        bot: BOT_NAME,
        connected: isConnected,
        uptime: process.uptime()
    });
});

// ========== INICIAR SERVIDOR ==========
const server = app.listen(PORT, () => {
    console.log(`[${BOT_NAME}] 🖥️ Panel web disponible en: http://localhost:${PORT}`);
    console.log(`[${BOT_NAME}] 📱 Escanea el QR en la página web.`);
});

// ========== CONEXIÓN WHATSAPP ==========
async function startSock() {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
    
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['ZYON Bot', 'Chrome', '1.0.0']
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            qrCode = qr;
            console.log('[ZYON] Nuevo QR generado. Ve a la página web para escanearlo.');
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            isConnected = false;
            qrCode = null;
            console.log(`[ZYON] Conexión cerrada. Código: ${statusCode}`);
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
            console.log(`[${BOT_NAME}] ✅ Conectado exitosamente a WhatsApp!`);
        }
    });

    // Evento de mensajes entrantes
    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        let text = '';
        if (msg.message.conversation) text = msg.message.conversation;
        else if (msg.message.extendedTextMessage?.text) text = msg.message.extendedTextMessage.text;
        else if (msg.message.imageMessage?.caption) text = msg.message.imageMessage.caption;
        else return;

        const sender = msg.key.remoteJid;
        console.log(`[${BOT_NAME}] Mensaje de ${sender}: ${text}`);

        try {
            const reply = await handleIncomingMessage(text, sender);
            if (reply) {
                await sock.sendMessage(sender, { text: reply });
            }
        } catch (error) {
            console.error('[ZYON] Error en IA:', error);
            await sock.sendMessage(sender, { text: '❌ Error con mi IA peruana. Intenta más tarde.' });
        }
    });
}

startSock();

// Cierre limpio
process.on('SIGINT', () => {
    console.log(`[${BOT_NAME}] Apagando...`);
    server.close(() => process.exit(0));
});
