/**
 * Recording playback is a local production tool, not a public-site feature.
 *
 * Local development and local builds keep it enabled by default. Public
 * deployments opt out explicitly with VITE_ENABLE_PLAY_MODE=false.
 */
export const PLAY_MODE_ENABLED =
  import.meta.env.VITE_ENABLE_PLAY_MODE !== 'false';
