// HTML labels pinned to 3D points: crisp text, brandable with CSS, cheap for a few hundred.

import { PerspectiveCamera, Vector3 } from 'three';

interface Label {
	el: HTMLElement;
	world: () => Vector3;
	maxDistance: number;
	minDistance: number;
	visible: boolean;
	declutter: boolean;
	w: number;
	x: number;
	y: number;
	d: number;
}

const _v = new Vector3();

export class LabelLayer {

	readonly el: HTMLElement;
	private labels = new Set<Label>();

	constructor( parent: HTMLElement ) {

		this.el = document.createElement( 'div' );
		this.el.className = 'label-layer';
		parent.append( this.el );

	}

	add( el: HTMLElement, world: () => Vector3, opts: { maxDistance?: number; minDistance?: number; declutter?: boolean } = {} ) {

		const l: Label = { el, world, maxDistance: opts.maxDistance ?? Infinity, minDistance: opts.minDistance ?? 0, visible: false, declutter: !! opts.declutter, w: 0, x: 0, y: 0, d: 0 };
		el.classList.add( 'label' );
		el.style.display = 'none';
		this.el.append( el );
		this.labels.add( l );
		return () => {

			el.remove();
			this.labels.delete( l );

		};

	}

	update( camera: PerspectiveCamera, width: number, height: number ) {

		const candidates: Label[] = [];
		for ( const l of this.labels ) {

			const p = l.world();
			l.d = p.distanceTo( camera.position );
			_v.copy( p ).project( camera );
			l.x = ( _v.x * 0.5 + 0.5 ) * width;
			l.y = ( - _v.y * 0.5 + 0.5 ) * height;
			const inView = l.d <= l.maxDistance && l.d >= l.minDistance && _v.z < 1 && _v.z > - 1 && Math.abs( _v.x ) < 1.15 && Math.abs( _v.y ) < 1.15;
			if ( inView ) candidates.push( l );
			else this.setVisible( l, false );

		}

		// nearest first; a decluttered label hides if it would overlap one already placed
		candidates.sort( ( a, b ) => a.d - b.d );
		const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
		for ( const l of candidates ) {

			if ( l.declutter ) {

				if ( ! l.w ) l.w = l.el.offsetWidth || 160;
				const r = { x0: l.x - l.w / 2 - 4, x1: l.x + l.w / 2 + 4, y0: l.y - 34, y1: l.y + 2 };
				if ( placed.some( q => r.x0 < q.x1 && r.x1 > q.x0 && r.y0 < q.y1 && r.y1 > q.y0 ) ) {

					this.setVisible( l, false );
					continue;

				}

				placed.push( r );

			}

			this.setVisible( l, true );
			l.el.style.transform = `translate3d(${ l.x.toFixed( 1 ) }px, ${ l.y.toFixed( 1 ) }px, 0)`;
			l.el.style.zIndex = String( Math.round( 100000 - l.d ) );

		}

	}

	private setVisible( l: Label, show: boolean ) {

		if ( show === l.visible ) return;
		l.el.style.display = show ? '' : 'none';
		l.visible = show;
		if ( show && ! l.w ) l.w = l.el.offsetWidth;

	}

	clear() {

		for ( const l of this.labels ) l.el.remove();
		this.labels.clear();

	}

}
