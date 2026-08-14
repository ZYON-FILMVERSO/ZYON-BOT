const axios = require('axios');

const IA_API_URL = process.env.IA_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
const IA_API_KEY = process.env.IA_API_KEY || '';
const IA_MODEL = process.env.IA_MODEL || 'llama3-70b-8192';

async function handleIncomingMessage(text, sender) {
    if (!IA_API_KEY || IA_API_KEY === 'tu_clave_secreta_aqui') {
        return '🤖 Hola, soy ZYON. Mi IA peruana aún no está configurada. El administrador debe agregar la variable IA_API_KEY en Render.';
    }

    try {
        const response = await axios.post(
            IA_API_URL,
            {
                model: IA_MODEL,
                messages: [
                    { role: 'system', content: 'Eres ZYON, un asistente peruano amigable. Responde en español.' },
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
                timeout: 15000
            }
        );

        const reply = response.data.choices?.[0]?.message?.content;
        return reply ? reply.trim() : '⚠️ No entendí la respuesta de la IA.';
    } catch (error) {
        console.error('[IA] Error:', error.response?.data || error.message);
        return '😅 Error al conectar con Groq. Revisa los logs.';
    }
}

module.exports = { handleIncomingMessage };
