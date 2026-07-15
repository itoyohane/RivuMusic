import { Disc3, RefreshCw, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { AlbumRecommendationCard } from "@/components/album/album-recommendation-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { YeeButton } from "@/components/yee-button";
import { getAlbumDiscoveries } from "@/lib/services/albumDiscovery";
import { useUserStore } from "@/lib/store/userStore/userStore";
import type {
	AlbumDiscoveryResult,
	AlbumRecommendationSource,
} from "@/lib/types";

type DiscoveryFilter = "all" | "personalized" | "new-release";

const SKELETON_KEYS = Array.from(
	{ length: 10 },
	(_, index) => `album-skeleton-${index + 1}`,
);

function AlbumDiscoverySkeleton() {
	return (
		<div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-5">
			{SKELETON_KEYS.map((key) => (
				<div
					key={key}
					className="aspect-[1/1.62] animate-pulse rounded-md border border-border bg-foreground/[0.045]"
				/>
			))}
		</div>
	);
}

export function AlbumDiscoveryPage() {
	const albumList = useUserStore((state) => state.albumList);
	const artistList = useUserStore((state) => state.artistList);
	const isLoggedin = useUserStore((state) => state.isLoggedin);
	const [filter, setFilter] = useState<DiscoveryFilter>("all");
	const seedKey = [
		...albumList.slice(0, 5).map((album) => `album:${album.id}`),
		...artistList.slice(0, 5).map((artist) => `artist:${artist.id}`),
	].join(",");

	const { data, error, isLoading, isValidating, mutate } =
		useSWR<AlbumDiscoveryResult>(
			["album-discovery", seedKey],
			() =>
				getAlbumDiscoveries({
					savedAlbums: albumList,
					savedArtists: artistList,
				}),
			{
				revalidateOnFocus: false,
				dedupingInterval: 5 * 60 * 1000,
			},
		);

	const items = useMemo(() => {
		if (!data) return [];
		if (filter === "new-release") {
			return data.items.filter((item) => item.source === "new-release");
		}
		if (filter === "personalized") {
			return data.items.filter((item) => item.source !== "new-release");
		}
		return data.items;
	}, [data, filter]);

	const sourceCounts = useMemo(() => {
		const counts = new Map<AlbumRecommendationSource, number>();
		for (const item of data?.items ?? []) {
			counts.set(item.source, (counts.get(item.source) ?? 0) + 1);
		}
		return counts;
	}, [data]);

	return (
		<div className="flex min-h-full w-full flex-col gap-7 px-8 py-8">
			<header className="flex items-start justify-between gap-6">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<Disc3 className="size-6 text-primary" />
						<h1 className="text-2xl font-bold">专辑发现</h1>
					</div>
					<p className="mt-2 max-w-3xl text-sm leading-6 text-foreground/62">
						{data?.personalized
							? `根据你的收藏生成，参考了 ${data.seedNames.join("、")}。`
							: isLoggedin
								? "先收藏几张专辑或音乐人，推荐会逐渐贴近你的口味。"
								: "当前展示公开新碟；登录并收藏后会生成个性化专辑推荐。"}
					</p>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<YeeButton
							icon={
								<RefreshCw
									className={isValidating ? "animate-spin" : undefined}
								/>
							}
							onClick={() => mutate()}
							disabled={isValidating}
							aria-label="刷新专辑推荐"
						/>
					</TooltipTrigger>
					<TooltipContent sideOffset={6}>刷新推荐</TooltipContent>
				</Tooltip>
			</header>

			<div className="flex items-center justify-between gap-4">
				<Tabs
					value={filter}
					onValueChange={(value) => setFilter(value as DiscoveryFilter)}
				>
					<TabsList>
						<TabsTrigger value="all">全部</TabsTrigger>
						<TabsTrigger value="personalized">为你推荐</TabsTrigger>
						<TabsTrigger value="new-release">新碟</TabsTrigger>
					</TabsList>
				</Tabs>

				{data?.personalized && (
					<div className="flex items-center gap-2 text-xs text-foreground/52">
						<Sparkles className="size-3.5" />
						<span>
							个性化{" "}
							{Array.from(sourceCounts.entries())
								.filter(([source]) => source !== "new-release")
								.reduce((sum, [, count]) => sum + count, 0)}{" "}
							张
						</span>
					</div>
				)}
			</div>

			{isLoading && <AlbumDiscoverySkeleton />}

			{error && !isLoading && (
				<div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
					<p className="font-medium">暂时无法获取专辑推荐</p>
					<p className="text-sm text-foreground/58">请检查网络或稍后刷新。</p>
				</div>
			)}

			{!isLoading && !error && items.length === 0 && (
				<div className="flex min-h-64 flex-col items-center justify-center gap-3 text-center">
					<Disc3 className="size-8 text-foreground/35" />
					<p className="font-medium">这个分类暂时没有推荐</p>
					<p className="text-sm text-foreground/58">
						切换到“全部”或“新碟”继续看看。
					</p>
				</div>
			)}

			{!isLoading && !error && items.length > 0 && (
				<div className="grid grid-cols-[repeat(auto-fill,minmax(13rem,1fr))] gap-5">
					{items.map((item) => (
						<AlbumRecommendationCard
							key={`${item.source}-${item.album.id}`}
							recommendation={item}
						/>
					))}
				</div>
			)}
		</div>
	);
}
