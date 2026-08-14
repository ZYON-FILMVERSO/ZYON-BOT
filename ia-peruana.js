// ia-peruana.js
const axios = require('axios');

// Configuración de tu IA (cambia estos valores o usa variables de entorno)
const IA_API_URL = process.env.IA_API_URL || 'https://tu-ia-peruana.com/api/chat';
const IA_API_KEY = process.env.IA_API_KEY || 'tu_clave_secreta';

/**
 * Función principal que recibe el mensaje del usuario y devuelve la respuesta de la IA.
 * @param {string} text - Mensaje del usuario.
 * @param {string} sender - ID del remitente (para contexto).
 * @returns {Promise<string>} - Respuesta de la IA.
 */
async function handleIncomingMessage(text, sender) {
    // Si tu IA necesita contexto, puedes almacenar historiales por sender en un Map global.
    try {
        const response = await axios.post(IA_API_URL, {
            message: text,
            userId: sender,
            // Otros campos que requiera tu API
        }, {
            headers: {
                'Authorization': `Bearer ${IA_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // Asume que la respuesta viene en response.data.reply
        // Ajusta según la estructura de tu API
        return response.data.reply || response.data.message || 'No entendí la respuesta de la IA.';
    } catch (error) {
        console.error('Error llamando a la IA peruana:', error.message);
        // Si tu IA tiene un modo offline o respuestas por defecto, puedes ponerlas aquí.
        return '⚠️ Mi IA peruana no está disponible en este momento.';
    }
}

module.exports = { handleIncomingMessage };
