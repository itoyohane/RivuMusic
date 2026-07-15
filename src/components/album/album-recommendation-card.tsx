import { Heart, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { YeeButton } from "@/components/yee-button";
import { subAlbum } from "@/lib/services/user";
import { usePlayerStore } from "@/lib/store/playerStore/playerStore";
import { useUserStore } from "@/lib/store/userStore/userStore";
import type { AlbumRecommendation } from "@/lib/types";
import { formateDate, GetThumbnail } from "@/lib/utils";
import { AlbumAiGuideDialog } from "./album-ai-guide-dialog";

interface AlbumRecommendationCardProps {
	recommendation: AlbumRecommendation;
}

export function AlbumRecommendationCard({
	recommendation,
}: AlbumRecommendationCardProps) {
	const { album } = recommendation;
	const isLoggedin = useUserStore((state) => state.isLoggedin);
	const albumListSet = useUserStore((state) => state.albumListSet);
	const toggleLikeAlbum = useUserStore((state) => state.toggleLikeAlbum);
	const playList = usePlayerStore((state) => state.playList);
	const isLiked = albumListSet.has(album.id);

	async function handleLike() {
		if (!isLoggedin) {
			toast.error("登录网易云账号后即可收藏专辑");
			return;
		}

		const targetLike = !isLiked;
		toggleLikeAlbum(album, targetLike);

		try {
			const success = await subAlbum(album.id, targetLike ? 1 : 2);
			if (!success) throw new Error("收藏接口返回失败");
			toast.success(targetLike ? "已收藏专辑" : "已取消收藏");
		} catch {
			toggleLikeAlbum(album, isLiked);
			toast.error("收藏失败，请稍后重试");
		}
	}

	return (
		<article className="group flex min-w-0 flex-col overflow-hidden rounded-md border border-border bg-card/45 transition-colors hover:bg-card/75">
			<Link
				to={`/detail/album?id=${album.id}`}
				className="relative aspect-square overflow-hidden bg-foreground/5"
				draggable={false}
			>
				<img
					src={GetThumbnail(album.picUrl ?? "")}
					alt={`${album.name} 专辑封面`}
					className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
					loading="lazy"
				/>
				<span className="absolute left-3 top-3 rounded-sm bg-black/68 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
					{recommendation.sourceLabel}
				</span>
			</Link>

			<div className="flex min-h-40 flex-1 flex-col gap-3 p-4">
				<div className="min-w-0">
					<Link
						to={`/detail/album?id=${album.id}`}
						className="line-clamp-1 text-[15px] font-semibold hover:text-primary"
					>
						{album.name}
					</Link>
					<p className="mt-1 line-clamp-1 text-sm text-foreground/58">
						{album.artists?.map((artist) => artist.name).join("、") ||
							"未知艺人"}
						{album.publishTime ? ` · ${formateDate(album.publishTime)}` : ""}
					</p>
				</div>

				<p className="line-clamp-2 text-sm leading-5 text-foreground/72">
					{recommendation.reason}
				</p>

				<div className="mt-auto flex items-center justify-end gap-1">
					<AlbumAiGuideDialog recommendation={recommendation} />

					<Tooltip>
						<TooltipTrigger asChild>
							<YeeButton
								icon={
									<Heart
										className={isLiked ? "fill-red-500 text-red-500" : ""}
									/>
								}
								onClick={handleLike}
								aria-label={isLiked ? "取消收藏专辑" : "收藏专辑"}
							/>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>
							{isLiked ? "取消收藏" : "收藏专辑"}
						</TooltipContent>
					</Tooltip>

					<Tooltip>
						<TooltipTrigger asChild>
							<YeeButton
								icon={<Play className="fill-current" />}
								onClick={() => playList(album.id, "album")}
								aria-label="播放专辑"
							/>
						</TooltipTrigger>
						<TooltipContent sideOffset={6}>播放专辑</TooltipContent>
					</Tooltip>
				</div>
			</div>
		</article>
	);
}
