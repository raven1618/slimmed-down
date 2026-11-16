// GeneratedSurfacePlugin ships in 3d-tiles-renderer's JS build but not in its type
// definitions (v0.5.4). Augment the module so TypeScript knows about it.
import type { ImageOverlay } from '3d-tiles-renderer/plugins';

declare module '3d-tiles-renderer/plugins' {
	export class GeneratedSurfacePlugin {
		constructor( options?: {
			overlay?: ImageOverlay | null;
			projection?: 'ellipsoid' | 'source' | string;
			endCaps?: boolean;
			center?: boolean;
			useRecommendedSettings?: boolean;
			applyOverlayTexture?: boolean;
		} );
	}
}
