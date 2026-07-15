import { Sparkles } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Dialog,
	DialogBody,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { YeeButton } from "@/components/yee-button";
import { generateAlbumGuide, hasAlbumAiConfig } from "@/lib/services/albumAi";
import type { AlbumRecommendation } from "@/lib/types";

interface AlbumAiGuideDialogProps {
	recommendation: AlbumRecommendation;
}

export function AlbumAiGuideDialog({
	recommendation,
}: AlbumAiGuideDialogProps) {
	const [guide, setGuide] = useState("");
	const [error, setError] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const isConfigured = hasAlbumAiConfig();

	async function handleGenerate() {
		setError("");
		setIsGenerating(true);
		try {
			setGuide(await generateAlbumGuide(recommendation));
		} catch (reason) {
			setError(reason instanceof Error ? reason.message : String(reason));
		} finally {
			setIsGenerating(false);
		}
	}

	return (
		<Dialog>
			<Tooltip>
				<TooltipTrigger asChild>
					<DialogTrigger asChild>
						<YeeButton icon={<Sparkles />} aria-label="AI 专辑导览" />
					</DialogTrigger>
				</TooltipTrigger>
				<TooltipContent sideOffset={6}>AI 专辑导览</TooltipContent>
			</Tooltip>

			<DialogContent className="sm:max-w-xl" showCloseButton>
				<DialogHeader>
					<DialogTitle className="pb-1">
						《{recommendation.album.name}》听前导览
					</DialogTitle>
					<DialogDescription className="px-4">
						AI 只接收当前专辑与推荐线索，不会读取或上传完整收藏库。
					</DialogDescription>
				</DialogHeader>

				<DialogBody>
					{!isConfigured && (
						<div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border text-center">
							<Sparkles className="size-7 text-foreground/38" />
							<p className="font-medium">还没有配置 AI 服务</p>
							<p className="max-w-sm text-sm leading-5 text-foreground/58">
								支持 DeepSeek、通义千问、OpenAI 和本机 OpenAI 兼容服务。
							</p>
							<Link
								to="/setting"
								className="text-sm font-medium text-primary hover:underline"
							>
								前往设置
							</Link>
						</div>
					)}

					{isConfigured && !guide && !error && (
						<div className="flex min-h-44 flex-col items-center justify-center gap-3 rounded-md bg-foreground/[0.035] text-center">
							<Sparkles className="size-7 text-primary" />
							<p className="font-medium">准备生成三段简短导览</p>
							<p className="text-sm text-foreground/58">
								仅在你点击生成后调用已配置的模型。
							</p>
						</div>
					)}

					{guide && (
						<div className="min-h-44 whitespace-pre-wrap rounded-md bg-foreground/[0.035] p-5 text-sm leading-7 text-foreground/82 select-text">
							{guide}
						</div>
					)}

					{error && (
						<div className="min-h-44 rounded-md border border-destructive/25 bg-destructive/5 p-5 text-sm leading-6 text-destructive select-text">
							{error}
						</div>
					)}
				</DialogBody>

				{isConfigured && (
					<DialogFooter className="justify-end">
						<YeeButton
							variant="default"
							size="lg"
							content={
								isGenerating ? "生成中..." : guide ? "重新生成" : "生成导览"
							}
							onClick={handleGenerate}
							disabled={isGenerating}
						/>
					</DialogFooter>
				)}
			</DialogContent>
		</Dialog>
	);
}
