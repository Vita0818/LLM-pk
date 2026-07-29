// Compatibility entry point. The production builder is the ESM module beside it.
import('./scripts_build_all_3_sources_catalog.js').catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
