// @ts-check
/**
 * Форматирует телефон в маску +7 (XXX) XXX-XX-XX
 * @param {string} raw - строка с любыми символами
 * @returns {string} отформатированный телефон
 */
export function formatPhone(raw) {
	// 1. Оставляем только цифры
	let value = raw.replace(/\D/g, "");

	// 2. Убираем 7 или 8 в начале, если они есть
	if (value.startsWith("7")) value = value.slice(1);
	if (value.startsWith("8")) value = value.slice(1);

	// 3. Обрезаем до 10 цифр (максимум для РФ)
	value = value.slice(0, 10);

	// 4. Собираем красивую строку по частям
	let formatted = "+7";
	if (value.length > 0) {
		formatted += ` (${value.substring(0, 3)}`;
	}
	if (value.length >= 4) {
		formatted += `) ${value.substring(3, 6)}`;
	}
	if (value.length >= 7) {
		formatted += `-${value.substring(6, 8)}`;
	}
	if (value.length >= 9) {
		formatted += `-${value.substring(8, 10)}`;
	}

	return formatted;
}
