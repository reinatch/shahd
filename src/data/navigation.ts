export interface NavigationItem {
	id: 'paintings' | 'animations' | 'design' | 'about' | 'contact';
	label: string;
	href: string;
	shape: 'disc' | 'diamond' | 'frame' | 'capsule' | 'star';
	colour: string;
	position: [number, number, number];
	scale: number;
}

const base = import.meta.env.BASE_URL;

/**
 * One source of truth for both the HTML menu and the five portrait objects.
 * Placeholder shapes/colours will later be replaced by Shahd's transparent logos.
 */
export const navigationItems: NavigationItem[] = [
	{ id: 'paintings', label: 'Paintings', href: `${base}paintings/`, shape: 'frame', colour: '#995f55', position: [-2.35, .82, .3], scale: 1 },
	{ id: 'animations', label: 'Animations', href: `${base}animations/`, shape: 'disc', colour: '#596c78', position: [-1.55, -.22, .3], scale: 1 },
	{ id: 'design', label: 'Design', href: `${base}design/`, shape: 'capsule', colour: '#69745d', position: [-.15, .28, .3], scale: 1 },
	{ id: 'about', label: 'About', href: `${base}about/`, shape: 'diamond', colour: '#b98758', position: [.9, 1.48, .3], scale: 1 },
	{ id: 'contact', label: 'Contact', href: `${base}contact/`, shape: 'star', colour: '#765e83', position: [1.55, .62, .3], scale: 1 },
];
