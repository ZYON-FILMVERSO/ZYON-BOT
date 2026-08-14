// ia-peruana.js
const axios = require('axios');

// Variables de entorno (configúralas en Render)
const IA_API_URL = process.env.IA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const IA_API_KEY = process.env.IA_API_KEY || '';
const IA_MODEL = process.env.IA_MODEL || 'llama3-8b-8192'; // Modelo rápido y gratuito

async function handleIncomingMessage(text, sender) {
    // Verificar que la API Key esté configurada
    if (!IA_API_KEY || IA_API_KEY === 'tu_clave_secreta_aqui') {
        console.warn('[IA] API Key no configurada.');
        return '🤖 Hola, soy ZYON. Mi IA peruana aún no está configurada. El administrador debe agregar la variable IA_API_KEY en Render.';
    }

    try {
        // Preparar la petición según el formato de Groq (compatible con OpenAI)
        const response = await axios.post(
            IA_API_URL,
            {
                model: IA_MODEL,
                messages: [
                    { role: 'system', content: 'Eres ZYON, un asistente peruano amigable y servicial. Responde en español.' },
                    { role: 'user', content: text }
                ],
                temperature: 0.7,
                max_tokens: 512,
            },
            {
                headers: {
                    'Authorization': `Bearer ${IA_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                timeout: 15000 // 15 segundos
            }
        );

        // Extraer la respuesta correcta
        const reply = response.data.choices?.[0]?.message?.content;
        if (reply) {
            return reply.trim();
        } else {
            console.error('[IA] Respuesta inesperada de Groq:', response.data);
            return '⚠️ Mi IA peruana respondió, pero no entendí el formato de la respuesta.';
        }

    } catch (error) {
        // Mostrar error detallado en los logs de Render
        console.error('[IA] Error al llamar a Groq:');
        if (error.response) {
            console.error('  Status:', error.response.status);
            console.error('  Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('  No se recibió respuesta de Groq (timeout o red).');
        } else {
            console.error('  Mensaje:', error.message);
        }
        
        // Devolver un mensaje más específico para depurar
        return `😅 Error al conectar con Groq. Revisa los logs de Render para más detalles.`;
    }
}

module.exports = { handleIncomingMessage };
