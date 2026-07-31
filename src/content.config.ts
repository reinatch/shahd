import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const projects = defineCollection({
	loader: glob({ base: './src/content/projects', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		year: z.number().int(),
		featured: z.boolean().default(false),
		objectType: z.enum(['planet', 'frame', 'crystal', 'card', 'custom-painted-object']),
		hairRegion: z.enum(['upper-left', 'upper-centre', 'centre-left', 'lower-left']),
		scale: z.enum(['small', 'medium', 'large']),
		accentColour: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
	}),
});

export const collections = { projects };
