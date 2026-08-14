// ia-peruana.js
const axios = require('axios');

// Leer variables de entorno
const IA_API_URL = process.env.IA_API_URL || 'https://tu-ia-peruana.com/api/chat';
const IA_API_KEY = process.env.IA_API_KEY || '';

async function handleIncomingMessage(text, sender) {
    // Verificar si la API Key está configurada
    if (!IA_API_KEY || IA_API_KEY === 'tu_clave_secreta') {
        console.warn('[IA] API Key no configurada. Responde con mensaje por defecto.');
        return '🤖 Hola, soy ZYON. Mi IA peruana aún no está configurada. El administrador debe agregar la variable IA_API_KEY en Render.';
    }

    try {
        const response = await axios.post(IA_API_URL, {
            message: text,
            userId: sender,
            // Si tu IA espera otros parámetros, agrégalos aquí
        }, {
            headers: {
                'Authorization': `Bearer ${IA_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 segundos máximo
        });

        // Ajusta esto según la estructura de respuesta de TU IA
        const reply = response.data.reply || response.data.message || response.data.response;
        if (reply) {
            return reply;
        } else {
            return '⚠️ Mi IA peruana respondió, pero no entendí el formato de la respuesta.';
        }

    } catch (error) {
        console.error('Error en IA Peruana:', error.message);
        if (error.response) {
            console.error('Detalle:', error.response.data);
        }
        return '😅 Mi IA peruana está teniendo problemas de conexión. ¡Inténtalo de nuevo!';
    }
}

module.exports = { handleIncomingMessage };
