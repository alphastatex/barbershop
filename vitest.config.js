import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["*.test.js"], // Ищем тесты ТОЛЬКО в корневой папке
		exclude: ["node_modules/**", "tests/**", "dist/**"], // Жёстко игнорируем лишнее
	},
});
