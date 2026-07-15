import { api } from "../api";
import type {
	Album,
	AlbumDiscoveryResult,
	AlbumRecommendation,
	AlbumRecommendationSource,
	Artist,
} from "../types";
import { getArtistAlbums } from "./artist";

interface NewAlbumsResponse {
	code: number;
	albums: Album[];
	total: number;
}

interface AlbumDiscoveryInput {
	savedAlbums: Album[];
	savedArtists: Artist[];
	limit?: number;
}

interface CandidateContext {
	source: AlbumRecommendationSource;
	seedName?: string;
	artistName?: string;
	baseScore: number;
}

function getPrimaryArtistId(album: Album) {
	return album.artists?.[0]?.id;
}

function getReason(context: CandidateContext) {
	if (context.source === "saved-album-artist") {
		return `因为你收藏了《${context.seedName}》，继续听 ${context.artistName} 的完整作品。`;
	}

	if (context.source === "saved-artist") {
		return `来自你收藏的音乐人 ${context.seedName}，适合作为下一张完整聆听。`;
	}

	return "近期上架的新专辑，适合用来拓展你的专辑收藏。";
}

function getSourceLabel(source: AlbumRecommendationSource) {
	if (source === "saved-album-artist") return "同艺人作品";
	if (source === "saved-artist") return "收藏艺人";
	return "新碟";
}

function addCandidate(
	candidates: Map<number, AlbumRecommendation>,
	album: Album,
	context: CandidateContext,
	position: number,
	excludedIds: Set<number>,
) {
	if (!album.id || excludedIds.has(album.id)) return;

	const candidate: AlbumRecommendation = {
		album,
		source: context.source,
		sourceLabel: getSourceLabel(context.source),
		reason: getReason(context),
		score: context.baseScore - position,
		seedName: context.seedName,
	};

	const previous = candidates.get(album.id);
	if (!previous || candidate.score > previous.score) {
		candidates.set(album.id, candidate);
	}
}

function diversifyByArtist(items: AlbumRecommendation[], limit: number) {
	const selected: AlbumRecommendation[] = [];
	const deferred: AlbumRecommendation[] = [];
	const artistCounts = new Map<number, number>();

	for (const item of items) {
		const artistId = getPrimaryArtistId(item.album);
		const count = artistId ? (artistCounts.get(artistId) ?? 0) : 0;

		if (artistId && count >= 2) {
			deferred.push(item);
			continue;
		}

		selected.push(item);
		if (artistId) artistCounts.set(artistId, count + 1);
		if (selected.length === limit) return selected;
	}

	return [...selected, ...deferred].slice(0, limit);
}

export async function getNewAlbums(limit = 36) {
	const response = await api.get<NewAlbumsResponse>("/album/new", {
		area: "ALL",
		limit: limit.toString(),
	});

	return response.albums ?? [];
}

export async function getAlbumDiscoveries({
	savedAlbums,
	savedArtists,
	limit = 24,
}: AlbumDiscoveryInput): Promise<AlbumDiscoveryResult> {
	const candidates = new Map<number, AlbumRecommendation>();
	const excludedIds = new Set(savedAlbums.map((album) => album.id));
	const seedNames = new Set<string>();
	const artistIds = new Set<number>();
	const artistTasks: Array<
		Promise<{ albums: Album[]; context: CandidateContext }>
	> = [];

	for (const album of savedAlbums.slice(0, 5)) {
		const artist = album.artists?.[0];
		if (!artist || artistIds.has(artist.id)) continue;
		artistIds.add(artist.id);
		seedNames.add(album.name);
		artistTasks.push(
			getArtistAlbums({ id: artist.id.toString(), limit: 10 }).then(
				(response) => ({
					albums: response.hotAlbums ?? [],
					context: {
						source: "saved-album-artist",
						seedName: album.name,
						artistName: artist.name,
						baseScore: 120,
					},
				}),
			),
		);
	}

	for (const artist of savedArtists.slice(0, 5)) {
		if (artistIds.has(artist.id)) continue;
		artistIds.add(artist.id);
		seedNames.add(artist.name);
		artistTasks.push(
			getArtistAlbums({ id: artist.id.toString(), limit: 10 }).then(
				(response) => ({
					albums: response.hotAlbums ?? [],
					context: {
						source: "saved-artist",
						seedName: artist.name,
						artistName: artist.name,
						baseScore: 100,
					},
				}),
			),
		);
	}

	const [artistResults, newAlbumsResult] = await Promise.all([
		Promise.allSettled(artistTasks),
		getNewAlbums(Math.max(limit, 36)),
	]);

	for (const result of artistResults) {
		if (result.status !== "fulfilled") continue;
		result.value.albums.forEach((album, index) => {
			addCandidate(candidates, album, result.value.context, index, excludedIds);
		});
	}

	newAlbumsResult.forEach((album, index) => {
		addCandidate(
			candidates,
			album,
			{
				source: "new-release",
				baseScore: 60,
			},
			index,
			excludedIds,
		);
	});

	const sorted = Array.from(candidates.values()).sort(
		(a, b) => b.score - a.score,
	);
	const items = diversifyByArtist(sorted, limit);

	return {
		items,
		personalized: items.some((item) => item.source !== "new-release"),
		seedNames: Array.from(seedNames).slice(0, 5),
		generatedAt: Date.now(),
	};
}
