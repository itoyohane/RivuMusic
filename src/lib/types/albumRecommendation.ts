import type { Album } from "./album";

export type AlbumRecommendationSource =
	| "saved-album-artist"
	| "saved-artist"
	| "new-release";

export interface AlbumRecommendation {
	album: Album;
	source: AlbumRecommendationSource;
	sourceLabel: string;
	reason: string;
	score: number;
	seedName?: string;
}

export interface AlbumDiscoveryResult {
	items: AlbumRecommendation[];
	personalized: boolean;
	seedNames: string[];
	generatedAt: number;
}
