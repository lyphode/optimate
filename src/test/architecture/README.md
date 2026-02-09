# Architecture validation

This folder contains tests that enforce clean architecture rules for the cutting optimization app.

## Run validation

```bash
# Run all architecture tests
npm run arch:validate

# Generate dependency graph (requires madge)
npm run dep:graph
# → writes dep-graph.svg

# Check for circular dependencies
npm run cycle:check
```

## Manual checks (grep)

```bash
# From project root (slab-optimizer-pro)

# Show UI layer importing from modules (should be empty for compliant UI)
grep -r "from.*@/modules" src/components src/pages --include="*.tsx" --include="*.ts" || true

# Show module cross-imports (excluding cutting-engine and test files)
grep -r "from.*@/modules" src/modules --include="*.ts" | grep -v "cutting-engine" | grep -v "test" || true
```

On Windows PowerShell you can use:

```powershell
Select-String -Path "src\components\*.tsx","src\pages\*.tsx" -Pattern "from\s+['\`"]@/modules" -Recurse
Select-String -Path "src\modules\*.ts" -Pattern "from\s+['\`"]@/modules" -Recurse | Where-Object { $_ -notmatch "cutting-engine|test" }
```

## Rules enforced

| # | Rule | How |
|---|------|-----|
| 1 | UI only imports `@/state`, `@/types`, React, UI libs | `architecture.test.ts` |
| 2 | State: single composition root, interfaces | `architecture.test.ts` |
| 3 | Modules: independent, only interfaces/types | `architecture.test.ts` |
| 4 | Interfaces: only `@/types` and other interfaces | `architecture.test.ts` |
| 5 | No circular dependencies | `npm run cycle:check` (madge) |
| 6 | No singletons in barrels (no `new X()` in index.ts) | `architecture.test.ts` |
| 7 | Pure cutting-engine: no async/side effects/external deps | `architecture.test.ts` |
| 8 | Dependency injection: module deps via constructor | `architecture.test.ts` |
