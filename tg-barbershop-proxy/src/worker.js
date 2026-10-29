// worker.js
export default {
  async fetch(request, env) {
    // 1. Обработка CORS (чтобы браузер разрешал запросы с твоего сайта)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    // Разрешаем только POST запросы
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const data = await request.json();
      
      // По умолчанию считаем, что заявка из браузера
      let username = "🌐 Из браузера (без Telegram)";

      // Если initData есть, значит это Telegram. Проверяем подпись.
      if (data.initData && data.initData.length > 0) {
        const isValidTG = await validateInitData(data.initData, env.BOT_TOKEN);
        
        if (isValidTG) {
          // Если подпись верная, вытаскиваем реальный юзернейм
          const urlParams = new URLSearchParams(data.initData);
          const userStr = urlParams.get("user");
          const user = userStr ? JSON.parse(userStr) : null;
          username = user?.username ? `@${user.username}` : `ID: ${user?.id || 'Неизвестно'}`;
        } else {
          // Если подпись НЕверная (глюк Desktop или прокси), НЕ блокируем, а ставим пометку
          username = "⚠️ Невалидный Telegram (возможно, Desktop/прокси)";
        }
      }

      // 3. ФОРМИРОВАНИЕ СООБЩЕНИЯ НА СЕРВЕРЕ
      // Экранируем HTML, чтобы защититься от XSS
      const escapeHTML = (str) => (str || '').replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag])
      );

      const text = `
🔥 <b>НОВАЯ ЗАЯВКА — BRUTAL STYLE</b>

👤 <b>Клиент:</b> ${escapeHTML(data.name)} (${username})
📞 <b>Телефон:</b> ${escapeHTML(data.phone)}
✂️ <b>Услуга:</b> ${escapeHTML(data.service) || '—'}
💈 <b>Мастер:</b> ${escapeHTML(data.master) || '—'}
💬 <b>Комментарий:</b> ${escapeHTML(data.comment) || '—'}

📅 ${new Date().toLocaleString('ru-RU')}
      `.trim();

      // 4. ОТПРАВКА В TELEGRAM
      const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.ADMIN_CHAT_ID, 
          text: text,
          parse_mode: 'HTML'
        })
      });

      const tgData = await tgRes.json();

      if (!tgRes.ok || !tgData.ok) {
        throw new Error(`Telegram API: ${tgData.description || 'Неизвестная ошибка'}`);
      }

      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });

    } catch (err) {
      // Возвращаем ошибку на фронтенд, чтобы app.js её показал
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};

// 5. ФУНКЦИЯ ВАЛИДАЦИИ INITDATA (HMAC-SHA256)
async function validateInitData(initData, botToken) {
  if (!initData) return false;
  
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;
  
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const encoder = new TextEncoder();
  
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
  
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
  
  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hexSignature === hash;
}