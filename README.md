# Shahd portfolio prototype

An Astro portfolio prototype with React and a Three.js portrait scene. It includes pages for projects, design, paintings, animations, about, and contact.

## Content status

The biography and example project are placeholders. This represents another person's portfolio, so personal details, project credits, and imagery need owner approval before publication or inclusion in Rei's featured work. This README does not imply that content is approved or the site is deployed.

## Run locally

Use Node.js 22.12 or later, as declared in `package.json`:

```sh
npm ci
npm run dev
```

`npm run build` produces `dist/`; `npm run preview` previews a production build. `npm run astro -- check` checks Astro and TypeScript diagnostics. The configured base path is `/shahd/`, and site origin is `https://reinatch.github.io`; these settings alone do not verify a deployment.

## Structure

- `src/pages/`: routes and project detail pages.
- `src/content/projects/` and `src/content.config.ts`: project content and schema.
- `src/components/PortraitIsland.tsx`: the React portrait scene.
- `src/layouts/` and `src/styles/`: shared page layout and styling.

Preserve project and third-party asset rights; no blanket license is introduced.
