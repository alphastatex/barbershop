import { describe, expect, it } from "vitest";
import { formatPhone } from "./utils.js";

describe("formatPhone — маска телефона", () => {
	it("форматирует голый номер", () => {
		expect(formatPhone("9991234567")).toBe("+7 (999) 123-45-67");
	});

	it("съедает префикс 7", () => {
		expect(formatPhone("79991234567")).toBe("+7 (999) 123-45-67");
	});

	it("съедает префикс 8", () => {
		expect(formatPhone("89991234567")).toBe("+7 (999) 123-45-67");
	});

	it("работает с частичным вводом", () => {
		expect(formatPhone("999123")).toBe("+7 (999) 123");
	});

	it("игнорирует мусор и символы", () => {
		expect(formatPhone("+7 (999) 123-45-67")).toBe("+7 (999) 123-45-67");
	});

	it("пустой ввод = +7", () => {
		expect(formatPhone("")).toBe("+7");
	});

	it("обрезает лишние цифры", () => {
		expect(formatPhone("999123456799999")).toBe("+7 (999) 123-45-67");
	});
});
