import { Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import SettingsExpandar, {
	SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Input } from "@/components/ui/input";
import { YeeButton } from "@/components/yee-button";
import {
	type AlbumAiConfig,
	DEFAULT_ALBUM_AI_CONFIG,
	loadAlbumAiConfig,
	saveAlbumAiConfig,
} from "@/lib/services/albumAi";

export function AlbumAiSettingCard() {
	const [config, setConfig] = useState<AlbumAiConfig>(loadAlbumAiConfig);
	const [isConfigured, setIsConfigured] = useState(Boolean(config.apiKey));

	function updateConfig(key: keyof AlbumAiConfig, value: string) {
		setConfig((current) => ({ ...current, [key]: value }));
	}

	function handleSave() {
		if (!config.baseUrl.trim() || !config.model.trim()) {
			toast.error("请填写接口地址和模型名称");
			return;
		}
		saveAlbumAiConfig(config);
		setIsConfigured(Boolean(config.apiKey.trim()));
		toast.success("AI 配置已保存在本机");
	}

	function handleReset() {
		setConfig(DEFAULT_ALBUM_AI_CONFIG);
		saveAlbumAiConfig(DEFAULT_ALBUM_AI_CONFIG);
		setIsConfigured(false);
		toast.success("AI 配置已重置");
	}

	return (
		<SettingsExpandar
			icon={<Sparkles />}
			title="专辑 AI 导览"
			subtitle="使用 OpenAI 兼容接口生成推荐解释，密钥仅保存在本机"
			trailing={
				<span className="text-xs text-foreground/48">
					{isConfigured ? "已配置" : "未配置"}
				</span>
			}
		>
			<SettingsExpandarDetail desc="接口地址">
				<Input
					className="w-80 bg-card"
					value={config.baseUrl}
					placeholder="https://api.deepseek.com/v1"
					onChange={(event) => updateConfig("baseUrl", event.target.value)}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="模型名称">
				<Input
					className="w-80 bg-card"
					value={config.model}
					placeholder="deepseek-chat"
					onChange={(event) => updateConfig("model", event.target.value)}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="API Key">
				<Input
					type="password"
					className="w-80 bg-card"
					value={config.apiKey}
					placeholder="输入 API Key"
					autoComplete="off"
					onChange={(event) => updateConfig("apiKey", event.target.value)}
				/>
			</SettingsExpandarDetail>
			<SettingsExpandarDetail desc="配置不会同步到云端，也不会提交到 Git">
				<div className="flex items-center gap-2">
					<YeeButton content="重置" size="sm" onClick={handleReset} />
					<YeeButton
						variant="default"
						content="保存"
						size="sm"
						onClick={handleSave}
					/>
				</div>
			</SettingsExpandarDetail>
		</SettingsExpandar>
	);
}
