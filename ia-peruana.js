// ia-peruana.js
const axios = require('axios');

// Variables de entorno (configúralas en Render)
const IA_API_URL = process.env.IA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const IA_API_KEY = process.env.IA_API_KEY || '';
// ⚠️ MODELOS ACTIVOS DE GROQ (feb 2025):
// - llama3-70b-8192  (recomendado, potente)
// - mixtral-8x7b-32768
// - gemma2-9b-it
// - llama-3.1-8b-instant
const IA_MODEL = process.env.IA_MODEL || 'llama3-70b-8192';

async function handleIncomingMessage(text, sender) {
    // Verificar API Key
    if (!IA_API_KEY || IA_API_KEY === 'tu_clave_secreta_aqui') {
        console.warn('[IA] API Key no configurada.');
        return '🤖 Hola, soy ZYON. Mi IA peruana aún no está configurada. El administrador debe agregar la variable IA_API_KEY en Render.';
    }

    try {
        const response = await axios.post(
            IA_API_URL,
            {
                model: IA_MODEL,
                messages: [
                    { 
                        role: 'system', 
                        content: 'Eres ZYON, un asistente peruano amigable, divertido y servicial. Responde siempre en español con un toque de humor peruano. Si te preguntan de dónde eres, dices que eres de Lima, Perú.' 
                    },
                    { role: 'user', content: text }
                ],
                temperature: 0.8,
                max_tokens: 512,
            },
            {
                headers: {
                    'Authorization': `Bearer ${IA_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 20000 // 20 segundos
            }
        );

        const reply = response.data.choices?.[0]?.message?.content;
        if (reply) {
            return reply.trim();
        } else {
            console.error('[IA] Respuesta inesperada:', response.data);
            return '⚠️ Mi IA peruana respondió, pero no entendí el formato de la respuesta.';
        }

    } catch (error) {
        console.error('[IA] Error al llamar a Groq:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
            
            // Mensajes más amigables según el error
            if (error.response.status === 401) {
                return '🔑 Error: La API Key de Groq no es válida. Revisa tu configuración en Render.';
            } else if (error.response.status === 400) {
                return '⚠️ Error: El modelo de IA no está disponible. El administrador debe actualizar la variable IA_MODEL.';
            } else if (error.response.status === 429) {
                return '⏳ Demasiadas peticiones a Groq. Espera un momento y vuelve a intentarlo.';
            } else {
                return `😅 Error ${error.response.status} al conectar con Groq. Revisa los logs de Render.`;
            }
        } else if (error.request) {
            console.error('  No se recibió respuesta de Groq (timeout o red).');
            return '⏰ Groq no respondió a tiempo. Intenta de nuevo en unos segundos.';
        } else {
            console.error('  Mensaje:', error.message);
            return '❌ Error interno al procesar tu mensaje. Intenta más tarde.';
        }
    }
}

module.exports = { handleIncomingMessage };
