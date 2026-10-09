// @ts-check
import { formatPhone } from "./utils.js";
const TG_CHAT_ID = '5641970486';

/* ========== КУРСОР ========== */
const cursor = /** @type {HTMLElement} */ (document.getElementById("scissorsCursor"));
let mx = 0;
let my = 0;
let cx = 0;
let cy = 0;
let cursorVisible = true;
/** @type {number | null} */
let animationId = null;

function animateCursor() {
	if (!cursorVisible) return;
	cx += (mx - cx) * 0.22;
	cy += (my - cy) * 0.22;
	cursor.style.left = `${cx}px`;
	cursor.style.top = `${cy}px`;
	animationId = requestAnimationFrame(animateCursor);
}

document.addEventListener("mousemove", (e) => {
	mx = e.clientX;
	my = e.clientY;
	if (cursorVisible && !animationId) animateCursor();
});
animateCursor();

document.addEventListener("mousedown", () => {
	if (cursorVisible) {
		cursor.classList.remove("snip");
		void cursor.offsetWidth; // force reflow
		cursor.classList.add("snip");
	}
});
cursor.addEventListener("animationend", () => cursor.classList.remove("snip"));

const formElements = document.querySelectorAll("input, select, textarea");
const modal = /** @type {HTMLElement} */ (document.getElementById("booking-modal"));
const openBtn = /** @type {HTMLElement} */ (document.getElementById("open-booking"));
const closeBtn = /** @type {HTMLElement} */ (document.getElementById("close-booking"));

function hideCursor() {
	cursorVisible = false;
	cursor.classList.add("hidden");
	if (animationId) {
		cancelAnimationFrame(animationId);
		animationId = null;
	}
}

function showCursor() {
	cursorVisible = true;
	cursor.classList.remove("hidden");
	if (!animationId) animateCursor();
}

for (const el of formElements) {
	el.addEventListener("focus", hideCursor);
	el.addEventListener("blur", () => {
		setTimeout(() => {
			const activeEl = document.activeElement;
			if (!activeEl || !activeEl.closest(".modal-content")) showCursor();
		}, 10);
	});
}

openBtn.addEventListener("click", () => {
	modal.classList.add("active");
	hideCursor();
});

function closeModal() {
	modal.classList.remove("active");
	showCursor();
	setTimeout(() => {
		const form = /** @type {HTMLFormElement} */ (document.getElementById("booking-form"));
		const successMsg = /** @type {HTMLElement} */ (document.getElementById("success-message"));
		const modalTitle = /** @type {HTMLElement} */ (document.getElementById("modal-title"));

		form.style.display = "block";
		successMsg.style.display = "none";
		modalTitle.textContent = "ЗАПИСЬ";
		form.reset();
	}, 400);
}

closeBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
	if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && modal.classList.contains("active")) {
		closeModal();
	}
});

/* ========== ОБРАБОТКА ФОРМЫ С МАСКОЙ ========== */
const bookingForm = /** @type {HTMLFormElement} */ (document.getElementById("booking-form"));
const phoneInput = /** @type {HTMLInputElement} */ (document.getElementById("phone"));

if (phoneInput) {
	phoneInput.addEventListener("input", (e) => {
		const input = /** @type {HTMLInputElement} */ (e.target);
		input.value = formatPhone(input.value);
	});
}

/**
 * Отправляет данные бронирования в Telegram
 * @param {{name: string, phone: string, service: string, master: string, comment: string}} data - данные из формы
 */
async function sendBookingToTelegram(data) {
	const text = `
🔥 <b>НОВАЯ ЗАЯВКА — BRUTAL STYLE</b>

👤 <b>Имя:</b> ${data.name}
📞 <b>Телефон:</b> ${data.phone}
✂️ <b>Услуга:</b> ${data.service || '—'}
💈 <b>Мастер:</b> ${data.master || '—'}
💬 <b>Комментарий:</b> ${data.comment || '—'}

📅 ${new Date().toLocaleString('ru-RU')}
  `.trim();

  try {
    // Ссылка на Cloudflare Worker (прокси)
    const PROXY_URL = 'https://tg-barbershop-proxy.alphastatex.workers.dev';

    const res = await fetch(
      `${PROXY_URL}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TG_CHAT_ID,
          text,
          parse_mode: 'HTML',
        }),
      }
    );
		if (!res.ok) {
			console.error('TG API error:', await res.text());
		} else {
			console.log('✅ Заявка отправлена в Telegram');
		}
	} catch (error) {
		console.error('❌ Не удалось отправить в Telegram:', error);
	}
}

// ⚠️ ИСПРАВЛЕНИЕ ЗДЕСЬ: добавлено ключевое слово async перед (e)
bookingForm.addEventListener("submit", async (e) => {
	e.preventDefault();
	
	const data = {
		name: /** @type {HTMLInputElement} */ (document.getElementById("form-name")).value,
		phone: phoneInput.value,
		service: /** @type {HTMLSelectElement} */ (document.getElementById("form-service")).value,
		master: /** @type {HTMLSelectElement} */ (document.getElementById("form-master")).value,
		comment: /** @type {HTMLTextAreaElement} */ (document.getElementById("form-comment")).value,
		date: new Date().toISOString(),
	};

	console.log("Заявка:", data);

	// Отправляем в Telegram
	await sendBookingToTelegram(data);

	// Показываем успех
	bookingForm.style.display = "none";
	/** @type {HTMLElement} */ (document.getElementById("modal-title")).textContent = "ГОТОВО";
	/** @type {HTMLElement} */ (document.getElementById("success-message")).style.display = "block";
});

/* ========== ПРОГРЕСС-БАР СКРОЛЛА ========== */
const scrollProgress = /** @type {HTMLElement} */ (document.getElementById("scrollProgress"));
window.addEventListener(
	"scroll",
	() => {
		const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
		scrollProgress.style.width = `${scrolled}%`;
	},
	{ passive: true }
);

/* ========== КНОПКА "НАВЕРХ" ========== */
const scrollTopBtn = /** @type {HTMLElement} */ (document.getElementById("scrollTop"));
window.addEventListener(
	"scroll",
	() => {
		if (window.scrollY > 500) scrollTopBtn.classList.add("visible");
		else scrollTopBtn.classList.remove("visible");
	},
	{ passive: true }
);
scrollTopBtn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ========== SCROLL-REVEAL ========== */
const reveals = document.querySelectorAll(".reveal");
const revealObs = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			if (entry.isIntersecting) entry.target.classList.add("visible");
		}
	},
	{ threshold: 0.15 }
);
for (const el of reveals) {
	revealObs.observe(el);
}

/* ========== СЧЁТЧИКИ ========== */
const statNums = document.querySelectorAll(".stat-num");
const statsObs = new IntersectionObserver(
	(entries) => {
		for (const entry of entries) {
			const el = /** @type {HTMLElement} */ (entry.target);
			if (entry.isIntersecting && !el.dataset.done) {
				el.dataset.done = "1";
				const target = Number.parseInt(el.dataset.target || "0", 10);
				const suffix = el.dataset.suffix || "";
				let current = 0;
				const step = Math.max(1, Math.ceil(target / 40));

				const intervalId = window.setInterval(() => {
					current += step;
					if (current >= target) {
						current = target;
						clearInterval(intervalId);
					}
					el.textContent = current.toLocaleString() + suffix;
				}, 25);
			}
		}
	},
	{ threshold: 0.5 }
);
for (const el of statNums) {
	statsObs.observe(el);
}

/* ========== РАСКРЫТИЕ МАСТЕРОВ ========== */
const toggleBtn = /** @type {HTMLButtonElement} */ (document.getElementById("toggle-team"));
const extraTeam = /** @type {HTMLElement} */ (document.getElementById("extra-team"));
let teamExpanded = false;

toggleBtn.addEventListener("click", () => {
	teamExpanded = !teamExpanded;
	extraTeam.classList.toggle("visible", teamExpanded);
	toggleBtn.textContent = teamExpanded
		? "[ СКРЫТЬ МАСТЕРОВ ↑ ]"
		: "[ ПОКАЗАТЬ ВСЕХ 12 МАСТЕРОВ ↓ ]";
});

/* ========== МОДАЛКА МАСТЕРОВ ========== */
const masterModal = /** @type {HTMLElement} */ (document.getElementById("masterModal"));
const closeMasterModal = /** @type {HTMLElement} */ (document.getElementById("closeMasterModal"));

/** @type {Record<string, {name: string, role: string, desc: string, stats: {label: string, value: string}[]}>} */
const mastersData = {
	1: { name: "Виктор", role: "[ 10 YRS ] · Старший барбер", desc: "Легенда BRUTAL STYLE. Виктор начинал ещё в 90-х, когда опасная бритва была единственным инструментом. Его техника бритья — это медитация. Клиенты приходят не просто за стрижкой, а за ритуалом.", stats: [{ label: "Специализация", value: "Классика, опасное бритьё" }, { label: "Опыт", value: "10 лет" }, { label: "Клиентов", value: "3200+" }, { label: "Напиток", value: "Jameson" }] },
	2: { name: "Дмитрий", role: "[ 07 YRS ] · Барбер", desc: "Дмитрий — мастер современных стрижек. Он знает все тренды от fade до undercut, но никогда не забывает о классике. Его клиенты — молодые профессионалы, которые ценят стиль.", stats: [{ label: "Специализация", value: "Fade, Undercut, Modern" }, { label: "Опыт", value: "7 лет" }, { label: "Клиентов", value: "2100+" }, { label: "Напиток", value: "IPA Beer" }] },
	3: { name: "Алекс", role: "[ 05 YRS ] · Барбер", desc: "Алекс — креативщик. Он берётся за самые сложные задачи: асимметрия, текстуры, эксперименты. Если хочешь что-то действительно уникальное — тебе к нему.", stats: [{ label: "Специализация", value: "Креатив, текстуры" }, { label: "Опыт", value: "5 лет" }, { label: "Клиентов", value: "1500+" }, { label: "Напиток", value: "Espresso" }] },
	4: { name: "Макс", role: "[ 04 YRS ] · Барбер", desc: "Макс — мастер терпения. Он обожает работать с детьми и знает, как найти подход к самому непоседливому ребёнку. Лёгкий фейд и детские стрижки — его конёк.", stats: [{ label: "Специализация", value: "Детские стрижки, лёгкий фейд" }, { label: "Опыт", value: "4 года" }, { label: "Клиентов", value: "1200+" }, { label: "Напиток", value: "Coca-Cola" }] },
	5: { name: "Сергей", role: "[ 06 YRS ] · Барбер", desc: "Сергей — перфекционист британской школы. Он может потратить лишний час, но сделает всё идеально. Классические стрижки, чёткие линии, безупречность.", stats: [{ label: "Специализация", value: "Британская классика" }, { label: "Опыт", value: "6 лет" }, { label: "Клиентов", value: "1800+" }, { label: "Напиток", value: "English Breakfast Tea" }] },
	6: { name: "Иван", role: "[ 03 YRS ] · Барбер", desc: "Иван — художник. Он работает с длинными волосами, делает окрашивания, создаёт образы. Если хочешь перемен — он поможет.", stats: [{ label: "Специализация", value: "Длинные волосы, окрашивание" }, { label: "Опыт", value: "3 года" }, { label: "Клиентов", value: "900+" }, { label: "Напиток", value: "Matcha Latte" }] },
	7: { name: "Роман", role: "[ 08 YRS ] · Барбер", desc: "Роман — геометр бороды. Он видит симметрию там, где другие видят хаос. Моделирование бороды — это наука, и Роман её знает в совершенстве.", stats: [{ label: "Специализация", value: "Моделирование бороды" }, { label: "Опыт", value: "8 лет" }, { label: "Клиентов", value: "2400+" }, { label: "Напиток", value: "Black Coffee" }] },
	8: { name: "Кирилл", role: "[ 02 YRS ] · Барбер", desc: "Кирилл — новая кровь. Он знает все тренды TikTok и Instagram. Gen Z стиль, треш-стрижки, эксперименты — это про него.", stats: [{ label: "Специализация", value: "Gen Z, TikTok тренды" }, { label: "Опыт", value: "2 года" }, { label: "Клиентов", value: "600+" }, { label: "Напиток", value: "Energy Drink" }] },
	9: { name: "Олег", role: "[ 09 YRS ] · Барбер", desc: "Олег — мастер опасного бритья. Он стажировался в легендарных барбершопах Лондона. Его опасная бритва остра как самурайский меч.", stats: [{ label: "Специализация", value: "Опасное бритьё" }, { label: "Опыт", value: "9 лет" }, { label: "Клиентов", value: "2800+" }, { label: "Напиток", value: "Single Malt" }] },
	10: { name: "Никита", role: "[ 05 YRS ] · Барбер", desc: "Никита — спортсмен. Он работает быстро, чётко, без лишней болтовни. Спортивные стрижки, армейский стиль, дисциплина.", stats: [{ label: "Специализация", value: "Спортивные стрижки" }, { label: "Опыт", value: "5 лет" }, { label: "Клиентов", value: "1600+" }, { label: "Напиток", value: "Protein Shake" }] },
	11: { name: "Егор", role: "[ 04 YRS ] · Барбер", desc: "Егор — текстурщик. Кудрявые волосы, волнистые, непослушные — он знает, как с ними работать. Его стрижки живут долго и выглядят отлично.", stats: [{ label: "Специализация", value: "Кудрявые волосы, текстуры" }, { label: "Опыт", value: "4 года" }, { label: "Клиентов", value: "1300+" }, { label: "Напиток", value: "Craft Beer" }] },
	12: { name: "Павел", role: "[ 07 YRS ] · Барбер", desc: "Павел — универсал. Он делает всё: от классики до авангарда. Не знает, что такое «невозможно». Его девиз: «Если клиент хочет — клиент получит».", stats: [{ label: "Специализация", value: "Универсал" }, { label: "Опыт", value: "7 лет" }, { label: "Клиентов", value: "2200+" }, { label: "Напиток", value: "Whiskey Sour" }] },
};

const clickableMasters = document.querySelectorAll(".member.clickable");
for (const member of clickableMasters) {
	member.addEventListener("click", () => {
		const masterEl = /** @type {HTMLElement} */ (member);
		const masterId = Number.parseInt(masterEl.dataset.master || "0", 10);
		const data = mastersData[String(masterId)];

		if (!data) return;

		const modalImage = /** @type {HTMLImageElement} */ (document.getElementById("modalImage"));
		const modalName = /** @type {HTMLElement} */ (document.getElementById("modalName"));
		const modalRole = /** @type {HTMLElement} */ (document.getElementById("modalRole"));
		const modalDesc = /** @type {HTMLElement} */ (document.getElementById("modalDesc"));
		const modalStats = /** @type {HTMLElement} */ (document.getElementById("modalStats"));

		const avatarImg = member.querySelector("img");
		if (avatarImg) {
			modalImage.src = avatarImg.src;
			modalImage.alt = data.name;
		}

		modalName.textContent = data.name;
		modalRole.textContent = data.role;
		modalDesc.textContent = data.desc;

		modalStats.innerHTML = data.stats.map((stat) => `<li><span>${stat.label}</span><span>${stat.value}</span></li>`).join("");

		masterModal.classList.add("active");
	});
}

function closeMasterModalFunc() {
	masterModal.classList.remove("active");
	showCursor();
}

closeMasterModal.addEventListener("click", closeMasterModalFunc);
masterModal.addEventListener("click", (e) => {
	if (e.target === masterModal) closeMasterModalFunc();
});
document.addEventListener("keydown", (e) => {
	if (e.key === "Escape" && masterModal.classList.contains("active")) {
		closeMasterModalFunc();
	}
});