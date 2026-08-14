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
