import { invoke } from "@tauri-apps/api/core";
import type { AlbumRecommendation } from "../types";

export interface AlbumAiConfig {
	baseUrl: string;
	apiKey: string;
	model: string;
}

const STORAGE_KEY = "album-ai-config";

export const DEFAULT_ALBUM_AI_CONFIG: AlbumAiConfig = {
	baseUrl: "https://api.deepseek.com/v1",
	apiKey: "",
	model: "deepseek-chat",
};

export function loadAlbumAiConfig(): AlbumAiConfig {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (!stored) return DEFAULT_ALBUM_AI_CONFIG;

	try {
		return {
			...DEFAULT_ALBUM_AI_CONFIG,
			...(JSON.parse(stored) as Partial<AlbumAiConfig>),
		};
	} catch {
		return DEFAULT_ALBUM_AI_CONFIG;
	}
}

export function saveAlbumAiConfig(config: AlbumAiConfig) {
	localStorage.setItem(
		STORAGE_KEY,
		JSON.stringify({
			baseUrl: config.baseUrl.trim().replace(/\/$/, ""),
			apiKey: config.apiKey.trim(),
			model: config.model.trim(),
		}),
	);
}

export function hasAlbumAiConfig() {
	const config = loadAlbumAiConfig();
	return Boolean(config.baseUrl && config.apiKey && config.model);
}

function buildAlbumGuidePrompt(recommendation: AlbumRecommendation) {
	const { album, reason, seedName } = recommendation;
	const artistNames = album.artists?.map((artist) => artist.name).join("、");
	const releaseYear = album.publishTime
		? new Date(album.publishTime).getFullYear()
		: "未知";

	return [
		"请为下面这张推荐专辑写一份简短听前导览。",
		`专辑：${album.name}`,
		`艺人：${artistNames || "未知"}`,
		`发行年份：${releaseYear}`,
		`推荐来源：${reason}`,
		seedName ? `用户偏好线索：${seedName}` : "",
		"",
		"输出三段，每段不超过 60 字：",
		"1. 为什么值得完整听",
		"2. 适合什么场景或情绪",
		"3. 建议如何开始听（未知曲目时不要编造歌名）",
	]
		.filter(Boolean)
		.join("\n");
}

export async function generateAlbumGuide(recommendation: AlbumRecommendation) {
	const config = loadAlbumAiConfig();
	if (!config.apiKey) throw new Error("请先在设置中配置 AI API Key");

	return invoke<string>("request_ai_album_guide", {
		request: {
			baseUrl: config.baseUrl,
			apiKey: config.apiKey,
			model: config.model,
			prompt: buildAlbumGuidePrompt(recommendation),
		},
	});
}
