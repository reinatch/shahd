import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { CatmullRomCurve3, MathUtils, Shape, Vector3, type Group } from 'three';
import type { NavigationItem } from '../data/navigation';

type Point = [number, number, number];

const HEAD_CENTRE_X = 2.95;
const HEAD_CENTRE_Y = -1.65;
const HEAD_RADIUS_X = .58;
const HEAD_RADIUS_Y = .72;
const HEAD_ROTATION = -.12;
const SHOULDER_BASELINE_Y = -2.52;
const SHOULDER_CROP = .22;
const VIEWPORT_EDGE_MARGIN = .025;
const CAMERA_ZOOM = 185;
const REFERENCE_VIEWPORT_HEIGHT = 900 / CAMERA_ZOOM;

interface RigControls {
	size: number;
	count: number;
	thickness: number;
	spread: number;
	deform: number;
	mouse: number;
	frontHair: number;
	headX: number;
	headY: number;
	headSize: number;
	headWidth: number;
	headLength: number;
	eyeSpacing: number;
	eyeHeight: number;
	eyeSize: number;
	shoulderWidth: number;
	shoulderHeight: number;
}

function starShape() {
	const shape = new Shape();
	for (let point = 0; point < 10; point++) {
		const radius = point % 2 === 0 ? 0.24 : 0.11;
		const angle = Math.PI / 2 + point * Math.PI / 5;
		const x = Math.cos(angle) * radius;
		const y = Math.sin(angle) * radius;
		if (point === 0) {
			shape.moveTo(x, y);
		} else {
			shape.lineTo(x, y);
		}
	}
	shape.closePath();
	return shape;
}

function HairRibbon({
	points,
	width = 0.42,
	colour = '#302a2c',
	index,
	mouse,
}: {
	points: Point[];
	width?: number;
	colour?: string;
	index: number;
	mouse: number;
}) {
	const pivot = useRef<Group>(null);
	const root = points[0];
	const shape = useMemo(() => {
		const curve = new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x - root[0], y - root[1], z - root[2])));
		const left: Vector3[] = [];
		const right: Vector3[] = [];
		const segments = 56;

		for (let index = 0; index <= segments; index++) {
			const t = index / segments;
			const point = curve.getPoint(t);
			const tangent = curve.getTangent(t).normalize();
			const normal = new Vector3(-tangent.y, tangent.x, 0);
			// Collapse both ends to a point: no square cap at the head or viewport edge.
			const taper = Math.pow(Math.sin(Math.PI * t), .55);
			const halfWidth = width * taper;
			left.push(point.clone().addScaledVector(normal, halfWidth));
			right.push(point.clone().addScaledVector(normal, -halfWidth));
		}

		const ribbon = new Shape();
		ribbon.moveTo(left[0].x, left[0].y);
		left.slice(1).forEach((point) => ribbon.lineTo(point.x, point.y));
		right.reverse().forEach((point) => ribbon.lineTo(point.x, point.y));
		ribbon.closePath();
		return ribbon;
	}, [points, root, width]);

	useFrame(({ pointer }, delta) => {
		if (!pivot.current) return;
		const falloff = 1 - index * 0.065;
		const targetRotation = pointer.y * mouse * 0.12 * falloff;
		const targetX = pointer.x * mouse * 0.045 * falloff;
		pivot.current.rotation.z = MathUtils.damp(pivot.current.rotation.z, targetRotation, 4, delta);
		pivot.current.position.x = MathUtils.damp(pivot.current.position.x, root[0] + targetX, 4, delta);
	});

	return (
		<group ref={pivot} position={root}>
			<mesh>
				<shapeGeometry args={[shape, 12]} />
				<meshBasicMaterial color={colour} />
			</mesh>
		</group>
	);
}

function MenuObject({ item, index }: { item: NavigationItem; index: number }) {
	const object = useRef<Group>(null);
	const hovered = useRef(false);
	useFrame(({ clock }) => {
		if (!object.current) return;
		const phase = clock.elapsedTime * 0.5 + index * 1.2;
		object.current.position.y = item.position[1] + Math.sin(phase) * 0.045;
		object.current.rotation.z = Math.sin(phase * 0.7) * 0.08;
		const targetScale = item.scale * (hovered.current ? 1.14 : 1);
		object.current.scale.lerp(new Vector3(targetScale, targetScale, targetScale), .16);
	});

	const announceHover = (label: string) => {
		window.dispatchEvent(new CustomEvent('portfolio-hover', { detail: label }));
	};

	const geometry = (() => {
		switch (item.shape) {
			case 'diamond': return <planeGeometry args={[0.42, 0.42]} />;
			case 'frame': return <ringGeometry args={[0.17, 0.29, 4]} />;
			case 'capsule': return <capsuleGeometry args={[0.14, 0.3, 6, 12]} />;
			case 'star': return <shapeGeometry args={[starShape()]} />;
			default: return <circleGeometry args={[0.27, 32]} />;
		}
	})();

	return (
		<group
			ref={object}
			position={item.position}
			scale={item.scale}
			onClick={(event) => {
				event.stopPropagation();
				window.location.assign(item.href);
			}}
			onPointerEnter={(event) => {
				event.stopPropagation();
				hovered.current = true;
				document.body.style.cursor = 'pointer';
				announceHover(item.label);
			}}
			onPointerLeave={() => {
				hovered.current = false;
				document.body.style.cursor = '';
				announceHover('Art');
			}}
		>
			<mesh rotation={item.shape === 'diamond' ? [0, 0, Math.PI / 4] : [0, 0, 0]}>
				{geometry}
				<meshBasicMaterial color={item.colour} />
			</mesh>
		</group>
	);
}

const ribbons: { points: Point[]; width: number; colour: string }[] = [
	{ points: [[2.1,-1.2,.04],[.8,-.8,.04],[-1,-.78,.04],[-3.2,-1.08,.04],[-5.2,-.88,.04]], width: .42, colour: '#332b31' },
	{ points: [[2.08,-1.05,.05],[.7,-.38,.05],[-1.05,-.2,.05],[-3.15,-.5,.05],[-5.15,-.15,.05]], width: .5, colour: '#4a3b40' },
	{ points: [[2.05,-.9,.06],[.62,.18,.06],[-.95,.55,.06],[-2.9,.28,.06],[-5,.72,.06]], width: .54, colour: '#332b31' },
	{ points: [[2.08,-.75,.07],[1.05,.72,.07],[-.15,1.45,.07],[-1.85,1.62,.07],[-4.35,1.32,.07]], width: .52, colour: '#514047' },
	{ points: [[2.18,-.66,.08],[1.6,.9,.08],[.55,1.9,.08],[-.75,2.45,.08],[-2.8,2.3,.08]], width: .48, colour: '#332b31' },
	{ points: [[2.3,-.7,.09],[2.45,.78,.09],[2.55,1.9,.09],[1.65,2.75,.09],[.15,2.9,.09]], width: .42, colour: '#493a40' },
];

const hairUndercoat: { points: Point[]; width: number; colour: string }[] = [
	{ points: [[2.95,-1.65,.01],[1.25,-.25,.01],[-.35,.08,.01],[-2.55,-.08,.01],[-5.15,-.18,.01]], width: 1.15, colour: '#2a2328' },
	{ points: [[2.95,-1.65,.012],[1.5,.55,.012],[.15,1.28,.012],[-1.8,1.35,.012],[-4.65,.92,.012]], width: .92, colour: '#332b31' },
	{ points: [[2.95,-1.65,.014],[.85,-1.18,.014],[-.9,-1.38,.014],[-2.9,-1.28,.014],[-5.15,-1.02,.014]], width: .72, colour: '#332b31' },
];

function PortraitSketch({ items, controls }: { items: NavigationItem[]; controls: RigControls }) {
	const portrait = useRef<Group>(null);
	const { pointer, viewport } = useThree();
	const rigScale = (viewport.height / REFERENCE_VIEWPORT_HEIGHT) * controls.size;
	const headRightExtent = Math.hypot(
		HEAD_RADIUS_X * controls.headWidth * Math.cos(HEAD_ROTATION),
		HEAD_RADIUS_Y * controls.headLength * Math.sin(HEAD_ROTATION),
	);
	const anchoredX = viewport.width / 2
		- VIEWPORT_EDGE_MARGIN
		- (HEAD_CENTRE_X + headRightExtent) * controls.headSize * rigScale;
	const anchoredY = -viewport.height / 2
		- SHOULDER_BASELINE_Y * controls.headSize * rigScale
		- SHOULDER_CROP * rigScale;
	const visibleRibbons = useMemo(() => {
		const foregroundSlots = Math.min(controls.frontHair, controls.count);
		const foregroundIndices = new Set(
			Array.from({ length: foregroundSlots }, (_, slot) =>
				Math.round(((slot + .5) * controls.count) / foregroundSlots - .5),
			),
		);
		return Array.from({ length: controls.count }, (_, index) => {
			const ratio = controls.count === 1 ? .5 : index / (controls.count - 1);
			const foreground = foregroundIndices.has(index);
			const guidePosition = ratio * (ribbons.length - 1);
			const lowerIndex = Math.floor(guidePosition);
			const upperIndex = Math.min(lowerIndex + 1, ribbons.length - 1);
			const blend = guidePosition - lowerIndex;
			const lower = ribbons[lowerIndex];
			const upper = ribbons[upperIndex];

			// Every ribbon begins behind the centre of the head. The second
			// control fans through 180°, producing a clean radial attachment.
			const angle = MathUtils.degToRad(210 - ratio * 180);
			const headCentre: Point = [2.95, -1.65, foreground ? .42 + ratio * .01 : .04 + ratio * .05];
			const scalpGuide: Point = [
				headCentre[0] + Math.cos(angle) * .62 * controls.headWidth * controls.headSize,
				headCentre[1] + Math.sin(angle) * .76 * controls.headLength * controls.headSize,
				headCentre[2],
			];

			const guideRoot: Point = [
				MathUtils.lerp(lower.points[0][0], upper.points[0][0], blend),
				MathUtils.lerp(lower.points[0][1], upper.points[0][1], blend),
				MathUtils.lerp(lower.points[0][2], upper.points[0][2], blend),
			];

			const points = lower.points.map((lowerPoint, pointIndex): Point => {
				const upperPoint = upper.points[pointIndex];
				const distance = pointIndex / (lower.points.length - 1);
				const wave = Math.sin(distance * Math.PI * 2 + index * .72) * controls.deform * .26;
				const guideX = MathUtils.lerp(lowerPoint[0], upperPoint[0], blend);
				const guideY = MathUtils.lerp(lowerPoint[1], upperPoint[1], blend);
				if (pointIndex === 0) return headCentre;
				const fanInfluence = Math.pow(1 - distance, 3);
				const scalpInfluence = Math.max(0, 1 - Math.abs(distance - .25) / .25);
				return [
					guideRoot[0] + (guideX - guideRoot[0]) * controls.spread
						+ (headCentre[0] - guideRoot[0]) * fanInfluence
						+ (scalpGuide[0] - guideX) * scalpInfluence,
					guideY + wave
						+ (headCentre[1] - guideRoot[1]) * fanInfluence
						+ (scalpGuide[1] - guideY) * scalpInfluence,
					MathUtils.lerp(lowerPoint[2], upperPoint[2], blend) + ratio * .045,
				];
			});

			const densityScale = MathUtils.clamp(12 / controls.count, .2, 1);
			return {
				colour: index % 3 === 0 ? '#514047' : index % 2 === 0 ? '#332b31' : '#493a40',
				points,
				width: MathUtils.lerp(lower.width, upper.width, blend) * controls.thickness * densityScale,
			};
		});
	}, [
		controls.count,
		controls.deform,
		controls.headLength,
		controls.headSize,
		controls.headWidth,
		controls.frontHair,
		controls.spread,
		controls.thickness,
	]);

	useFrame(({ clock }, delta) => {
		if (!portrait.current) return;
		portrait.current.position.x = anchoredX;
		portrait.current.position.y = anchoredY + Math.sin(clock.elapsedTime * 0.8) * 0.008;
		portrait.current.rotation.y = MathUtils.damp(portrait.current.rotation.y, pointer.x * controls.mouse * 0.018, 4, delta);
		portrait.current.rotation.x = MathUtils.damp(portrait.current.rotation.x, -pointer.y * controls.mouse * 0.008, 4, delta);
	});

	return (
		<group
			ref={portrait}
			position={[anchoredX, anchoredY, 0]}
			scale={rigScale}
		>
			{/* The head/root control is parent of hair, face, body and embedded objects. */}
			<group position={[controls.headX, controls.headY, 0]}>
				{hairUndercoat.map((ribbon, index) => (
					<HairRibbon
						key={`undercoat-${index}`}
						{...ribbon}
						width={ribbon.width * controls.thickness}
						index={index}
						mouse={controls.mouse * .25}
					/>
				))}
				{visibleRibbons.map((ribbon, index) => (
					<HairRibbon key={`${index}-${controls.count}`} {...ribbon} index={index} mouse={controls.mouse} />
				))}

				{/* Head size/deformation stays local and does not change ribbon length. */}
				<group scale={controls.headSize}>
					<mesh position={[3.05, SHOULDER_BASELINE_Y, .5]} scale={[1.18 * controls.shoulderWidth, .5 * controls.shoulderHeight, 1]}>
						<circleGeometry args={[1, 64, 0, Math.PI]} />
						<meshBasicMaterial color="#a66f5b" />
					</mesh>
					{/* <mesh position={[2.34, -1.78, .13]} rotation={[0, 0, -.18]} scale={[.38, .78, 1]}>
						<planeGeometry args={[1, 1]} />
						<meshBasicMaterial color="#b98067" />
					</mesh> */}
					<mesh position={[HEAD_CENTRE_X, HEAD_CENTRE_Y, .55]} rotation={[0, 0, HEAD_ROTATION]} scale={[HEAD_RADIUS_X * controls.headWidth, HEAD_RADIUS_Y * controls.headLength, 1]}>
						<circleGeometry args={[1, 64]} />
						<meshBasicMaterial color="#c99578" />
					</mesh>
					<mesh position={[2.91 - .19 * controls.eyeSpacing, -1.46 + controls.eyeHeight, .6]} scale={[.09 * controls.eyeSize, .025 * controls.eyeSize, 1]}>
						<circleGeometry args={[1, 20]} />
						<meshBasicMaterial color="#28231f" />
					</mesh>
					<mesh position={[2.91 + .19 * controls.eyeSpacing, -1.46 + controls.eyeHeight, .6]} scale={[.09 * controls.eyeSize, .025 * controls.eyeSize, 1]}>
						<circleGeometry args={[1, 20]} />
						<meshBasicMaterial color="#28231f" />
					</mesh>
	
				</group>

				{items.map((item, index) => <MenuObject key={item.id} item={item} index={index} />)}
			</group>
		</group>
	);
}

export default function PortraitIsland({ items }: { items: NavigationItem[] }) {
	const [controlsVisible, setControlsVisible] = useState(false);
	const [controls, setControls] = useState<RigControls>({
		size: 1,
		count: 18,
		thickness: 1,
		spread: 1,
		deform: 0,
		mouse: .65,
		frontHair: 1,
		headX: 0,
		headY: 0,
		headSize: 1,
		headWidth: 1,
		headLength: 1,
		eyeSpacing: 1,
		eyeHeight: 0,
		eyeSize: 1,
		shoulderWidth: 1,
		shoulderHeight: 1,
	});

	const sliders: { key: keyof RigControls; group: 'Hair' | 'Head' | 'Eyes' | 'Body'; label: string; min: number; max: number; step: number }[] = [
		{ key: 'size', group: 'Hair', label: 'Overall size', min: .7, max: 1.3, step: .01 },
		{ key: 'count', group: 'Hair', label: 'Ribbons', min: 1, max: 50, step: 1 },
		{ key: 'thickness', group: 'Hair', label: 'Thickness', min: .45, max: 1.5, step: .01 },
		{ key: 'spread', group: 'Hair', label: 'Length / spread', min: .65, max: 1.35, step: .01 },
		{ key: 'deform', group: 'Hair', label: 'Deform', min: 0, max: 10, step: .01 },
		{ key: 'mouse', group: 'Hair', label: 'Mouse IK', min: 0, max: 1.5, step: .01 },
		{ key: 'frontHair', group: 'Hair', label: 'Hair over objects', min: 0, max: 12, step: 1 },
		{ key: 'headX', group: 'Head', label: 'Position X', min: -1.5, max: 1.5, step: .01 },
		{ key: 'headY', group: 'Head', label: 'Position Y', min: -1.2, max: 1.2, step: .01 },
		{ key: 'headSize', group: 'Head', label: 'Size', min: .65, max: 1.5, step: .01 },
		{ key: 'headWidth', group: 'Head', label: 'Width', min: .65, max: 1.5, step: .01 },
		{ key: 'headLength', group: 'Head', label: 'Length', min: .65, max: 1.5, step: .01 },
		{ key: 'eyeSpacing', group: 'Eyes', label: 'Spacing', min: .5, max: 1.8, step: .01 },
		{ key: 'eyeHeight', group: 'Eyes', label: 'Height', min: -.25, max: .25, step: .01 },
		{ key: 'eyeSize', group: 'Eyes', label: 'Size', min: .5, max: 2, step: .01 },
		{ key: 'shoulderWidth', group: 'Body', label: 'Shoulder width', min: .5, max: 1.8, step: .01 },
		{ key: 'shoulderHeight', group: 'Body', label: 'Shoulder height', min: .5, max: 1.8, step: .01 },
	];

	useEffect(() => {
		const toggleControls = (event: KeyboardEvent) => {
			const target = event.target as HTMLElement | null;
			const editing = target?.matches('input, textarea, select, [contenteditable="true"]');
			if (!editing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === 'q') {
				event.preventDefault();
				setControlsVisible((visible) => !visible);
			}
		};
		window.addEventListener('keydown', toggleControls);
		return () => window.removeEventListener('keydown', toggleControls);
	}, []);

	return (
		<Fragment>
			<div className="portrait-canvas">
				<Canvas orthographic camera={{ position: [0, 0, 7], zoom: CAMERA_ZOOM }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
					<PortraitSketch items={items} controls={controls} />
				</Canvas>
			</div>
			{controlsVisible && <details className="rig-controls" open>
				<summary>Hair rig</summary>
				<div className="rig-controls__panel">
					{(['Hair', 'Head', 'Eyes', 'Body'] as const).map((group) => (
						<fieldset key={group}>
							<legend>{group}</legend>
							{sliders.filter((slider) => slider.group === group).map(({ key, label, min, max, step }) => (
								<label key={key}>
									<span>{label}<output>{controls[key].toFixed(step === 1 ? 0 : 2)}</output></span>
									<input
										type="range"
										min={min}
										max={max}
										step={step}
										value={controls[key]}
										onChange={(event) => setControls((current) => ({ ...current, [key]: Number(event.target.value) }))}
									/>
								</label>
							))}
						</fieldset>
					))}
					<button type="button" onClick={() => setControls({
						size: 1, count: 18, thickness: 1, spread: 1, deform: 0, mouse: .65, frontHair: 4,
						headX: 0, headY: 0, headSize: 1, headWidth: 1, headLength: 1,
						eyeSpacing: 1, eyeHeight: 0, eyeSize: 1, shoulderWidth: 1, shoulderHeight: 1,
					})}>
						Reset
					</button>
				</div>
			</details>}
		</Fragment>
	);
}
