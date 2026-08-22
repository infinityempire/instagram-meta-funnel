# Build Verification

Final validation completed with `pnpm test` and `pnpm check`. A production-oriented build also completed with:

```bash
pnpm exec vite build --minify=false
pnpm exec esbuild server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

The standard `pnpm build` minifies a large dependency graph and exceeded the current sandbox resource limit during local validation. This was a sandbox resource limit, not a TypeScript error. The production deployment environment should run the standard build with its normal resource allocation.
