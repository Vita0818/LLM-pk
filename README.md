# LLMpk

LLMpk is a configuration-level LLM leaderboard that combines capability,
engineering, agentic, search, pricing, and latency observations from multiple
public benchmark sources.

## Local development

```bash
npm ci
npm run dev
```

The development server is available at `http://localhost:5173/`.

## Validation

```bash
npm test
npm run build
```

## Deployment

Pushes to `main` are tested, built, and deployed to GitHub Pages by
`.github/workflows/deploy-pages.yml`.

The production site is expected at:

<https://vita0818.github.io/LLM-pk/>
