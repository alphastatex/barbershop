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
      
      // 2. ВАЛИДАЦИЯ INIT DATA (Проверка, что запрос от настоящего Telegram)
      // env.BOT_TOKEN берется из секретов, которые ты только что настроил
      const isValid = await validateInitData(data.initData, env.BOT_TOKEN);
      if (!isValid) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { 
          status: 403, 
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } 
        });
      }

      // Извлекаем данные пользователя из initData
      const urlParams = new URLSearchParams(data.initData);
      const userStr = urlParams.get("user");
      const user = userStr ? JSON.parse(userStr) : null;
      const username = user?.username ? `@${user.username}` : `ID: ${user?.id || 'Неизвестно'}`;

      // 3. ФОРМИРОВАНИЕ СООБЩЕНИЯ НА СЕРВЕРЕ
      // Экранируем HTML, чтобы защититься от XSS (вдруг кто-то введет <script>)
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
      // env.ADMIN_CHAT_ID также берется из секретов
      const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: env.ADMIN_CHAT_ID, // Жестко заданный ID админа, клиент не может его изменить
          text: text,
          parse_mode: 'HTML'
        })
      });

      if (!tgRes.ok) {
        const errorText = await tgRes.text();
        throw new Error(`Telegram API error: ${errorText}`);
      }

      return new Response(JSON.stringify({ success: true }), { 
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }
  }
};

// 5. ФУНКЦИЯ ВАЛИДАЦИИ INITDATA
// Проверяет криптографическую подпись, которую генерирует Telegram
async function validateInitData(initData, botToken) {
  if (!initData) return false;
  
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  if (!hash) return false;
  
  urlParams.delete('hash');
  
  // Сортируем параметры по алфавиту
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  const encoder = new TextEncoder();
  
  // Шаг 1: Создаем секретный ключ (Key = "WebAppData", Message = botToken)
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode('WebAppData'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
  
  // Шаг 2: Вычисляем подпись (Key = secret, Message = dataCheckString)
  const key = await crypto.subtle.importKey(
    'raw',
    secret,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
  
  // Конвертируем в hex строку для сравнения
  const hexSignature = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return hexSignature === hash;
}