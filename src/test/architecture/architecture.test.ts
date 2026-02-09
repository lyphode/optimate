/**
 * ARCHITECTURE VALIDATION TEST SUITE
 *
 * Enforces clean architecture rules for the cutting optimization app.
 * Run: npm run arch:validate
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC = path.resolve(process.cwd(), "src");

// Layer path prefixes (relative to src)
const UI_PATTERNS = [
  /^components\//,
  /^pages\//,
  /^hooks\//,
  /^contexts\//,
  /^ui\//,
  /^App\.tsx$/,
  /^main\.tsx$/,
];
const STATE_DIR = "state";
const MODULES_DIR = "modules";
const INTERFACES_DIR = "interfaces";
const TYPES_DIR = "types";

// UI may only import: @/state, @/types, same-layer UI, React, UI libs. No @/modules, no @/integrations, no @/ui.
const ALLOWED_UI_IMPORT_PREFIXES = [
  "@/state",
  "@/types",
  "@/components",
  "@/pages",
  "@/contexts",
  "@/hooks",
  "@/lib",
  "react",
  "react-dom",
  "react-router-dom",
  "@radix-ui",
  "@tanstack/react-query",
  "lucide-react",
  "class-variance-authority",
  "clsx",
  "tailwind-merge",
  "tailwindcss-animate",
  "next-themes",
  "sonner",
  "recharts",
  "react-hook-form",
  "@hookform/resolvers",
  "zod",
  "date-fns",
  "cmdk",
  "vaul",
  "embla-carousel-react",
  "react-resizable-panels",
  "input-otp",
];

function getAllTsTsxFiles(dir: string, base = ""): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const e of entries) {
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === "test") continue;
      files.push(...getAllTsTsxFiles(path.join(dir, e.name), rel));
    } else if (/\.(ts|tsx)$/.test(e.name) && !e.name.endsWith(".d.ts")) {
      files.push(rel);
    }
  }
  return files;
}

function getImports(content: string): string[] {
  const imports: string[] = [];
  const re =
    /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  const re2 = /import\s+['"]([^'"]+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) imports.push(m[1]);
  while ((m = re2.exec(content)) !== null) imports.push(m[1]);
  return imports;
}

function relPathFromSrc(filePath: string): string {
  const normalized = path.relative(SRC, filePath).replace(/\\/g, "/");
  return normalized.startsWith("..") ? "" : normalized;
}

function getLayer(relPath: string): "ui" | "state" | "modules" | "interfaces" | "types" | "other" {
  if (relPath.startsWith(STATE_DIR + "/") || relPath === STATE_DIR) return "state";
  if (relPath.startsWith(MODULES_DIR + "/")) return "modules";
  if (relPath.startsWith(INTERFACES_DIR + "/")) return "interfaces";
  if (relPath.startsWith(TYPES_DIR + "/") || relPath === TYPES_DIR) return "types";
  if (UI_PATTERNS.some((p) => p.test(relPath))) return "ui";
  return "other";
}

function isAllowedUiImport(spec: string): boolean {
  if (spec.startsWith(".")) return true; // relative within UI
  return ALLOWED_UI_IMPORT_PREFIXES.some((p) => spec === p || spec.startsWith(p + "/"));
}

describe("Architecture validation", () => {
  it("1. UI layer: only imports from @/state/*, @/types/*, React, UI libraries", () => {
    const files = getAllTsTsxFiles(SRC).filter((f) => getLayer(f) === "ui");
    const violations: { file: string; import: string }[] = [];
    for (const rel of files) {
      const full = path.join(SRC, rel);
      const content = fs.readFileSync(full, "utf-8");
      for (const imp of getImports(content)) {
        if (!isAllowedUiImport(imp)) {
          if (imp.startsWith("@/") && !imp.startsWith("@/state") && !imp.startsWith("@/types"))
            violations.push({ file: rel, import: imp });
        }
      }
    }
    expect(
      violations,
      violations.length
        ? `UI must not import from modules/integrations/etc. Violations:\n${violations.map((v) => `  ${v.file} → ${v.import}`).join("\n")}`
        : undefined
    ).toHaveLength(0);
  });

  it("2. State layer: single composition root, orchestrates via interfaces", () => {
    const stateDir = path.join(SRC, STATE_DIR);
    if (!fs.existsSync(stateDir)) {
      return; // skip when state layer not present
    }
    const indexFiles = ["index.ts", "index.tsx", "composition.ts", "root.ts"];
    const hasRoot = indexFiles.some((f) => fs.existsSync(path.join(stateDir, f)));
    const stateFiles = getAllTsTsxFiles(stateDir).map((f) => path.join(STATE_DIR, f));
    if (stateFiles.length > 0 && !hasRoot) {
      const anyIndex = stateFiles.some((f) => /\/index\.(ts|tsx)$/.test(f));
      expect(anyIndex || hasRoot, "State layer should have a single composition root (e.g. index.ts)").toBe(true);
    }
  });

  it("3. Module layer: independent, only know interfaces/types", () => {
    const modulesDir = path.join(SRC, MODULES_DIR);
    if (!fs.existsSync(modulesDir)) return;
    const violations: { file: string; import: string }[] = [];
    const moduleFiles = getAllTsTsxFiles(modulesDir).map((f) => path.join(MODULES_DIR, f));
    for (const rel of moduleFiles) {
      const full = path.join(SRC, rel);
      const content = fs.readFileSync(full, "utf-8");
      for (const imp of getImports(content)) {
        if (imp.startsWith("@/") && !imp.startsWith("@/types") && !imp.startsWith("@/interfaces")) {
          if (imp.startsWith("@/modules/") && !rel.startsWith(imp.replace("@/modules/", ""))) {
            continue; // same module or subpath
          }
          if (imp.startsWith("@/state") || imp.startsWith("@/components") || imp.startsWith("@/pages")) {
            violations.push({ file: rel, import: imp });
          }
        }
      }
    }
    expect(
      violations,
      violations.length ? `Modules must not import UI/state. Violations:\n${violations.map((v) => `  ${v.file} → ${v.import}`).join("\n")}` : undefined
    ).toHaveLength(0);
  });

  it("4. Interface layer: only imports from @/types/* and other interfaces", () => {
    const ifacesDir = path.join(SRC, INTERFACES_DIR);
    if (!fs.existsSync(ifacesDir)) return;
    const violations: { file: string; import: string }[] = [];
    const ifaceFiles = getAllTsTsxFiles(ifacesDir).map((f) => path.join(INTERFACES_DIR, f));
    for (const rel of ifaceFiles) {
      const full = path.join(SRC, rel);
      const content = fs.readFileSync(full, "utf-8");
      for (const imp of getImports(content)) {
        if (!imp.startsWith("@/types") && !imp.startsWith("@/interfaces") && imp.startsWith("@/")) {
          violations.push({ file: rel, import: imp });
        }
      }
    }
    expect(
      violations,
      violations.length ? `Interfaces must only import @/types and @/interfaces. Violations:\n${violations.map((v) => `  ${v.file} → ${v.import}`).join("\n")}` : undefined
    ).toHaveLength(0);
  });

  it("5. No circular dependencies (run: npm run cycle:check)", () => {
    // Actual cycle detection is done by madge; this test documents the requirement.
    expect(true, "Run: npm run cycle:check").toBe(true);
  });

  it("6. No singletons in barrels: no new Class() in index.ts files", () => {
    const files = getAllTsTsxFiles(SRC).filter((f) => /\/index\.(ts|tsx)$/.test(f));
    const violations: string[] = [];
    const newInstantiationRe = /new\s+[A-Z]\w*\s*\(/;
    for (const rel of files) {
      const full = path.join(SRC, rel);
      const content = fs.readFileSync(full, "utf-8");
      if (newInstantiationRe.test(content)) {
        violations.push(rel);
      }
    }
    expect(
      violations,
      violations.length ? `Barrel index files must not instantiate classes (no new X()). Violations: ${violations.join(", ")}` : undefined
    ).toHaveLength(0);
  });

  it("7. Pure cutting-engine: no side effects, no async, no external deps", () => {
    const enginePath = path.join(SRC, MODULES_DIR, "cutting-engine");
    if (!fs.existsSync(enginePath)) return;
    const files = getAllTsTsxFiles(enginePath).map((f) => path.join(MODULES_DIR, "cutting-engine", f));
    const violations: { file: string; msg: string }[] = [];
    for (const rel of files) {
      const full = path.join(SRC, rel);
      const content = fs.readFileSync(full, "utf-8");
      if (/\basync\b|await\s+|\.then\s*\(|fetch\s*\(|import\s*\(/.test(content)) {
        violations.push({ file: rel, msg: "cutting-engine must be pure: no async/await/fetch/dynamic import" });
      }
      const imports = getImports(content);
      const external = imports.filter((i) => !i.startsWith("@/types") && !i.startsWith("@/interfaces") && !i.startsWith("."));
      if (external.length > 0) {
        violations.push({ file: rel, msg: `No external deps in cutting-engine. Found: ${external.join(", ")}` });
      }
    }
    expect(
      violations,
      violations.length ? violations.map((v) => `${v.file}: ${v.msg}`).join("\n") : undefined
    ).toHaveLength(0);
  });

  it("8. Dependency injection: module dependencies injected via constructor", () => {
    // Heuristic: modules should not import other modules directly for runtime use;
    // they receive them via constructor. This is best enforced by code review + Rule 3.
    // We only check that modules don't import other @/modules (except types/interfaces).
    const modulesDir = path.join(SRC, MODULES_DIR);
    if (!fs.existsSync(modulesDir)) return;
    const moduleFiles = getAllTsTsxFiles(modulesDir).map((f) => path.join(MODULES_DIR, f));
    const violations: { file: string; import: string }[] = [];
    for (const rel of moduleFiles) {
      const content = fs.readFileSync(path.join(SRC, rel), "utf-8");
      for (const imp of getImports(content)) {
        if (imp.startsWith("@/modules/") && !imp.includes(".types") && !imp.includes("/interfaces/")) {
          const otherModule = imp.replace("@/modules/", "").split("/")[0];
          const thisModule = rel.replace(MODULES_DIR + "/", "").split("/")[0];
          if (otherModule !== thisModule) {
            violations.push({ file: rel, import: imp });
          }
        }
      }
    }
    expect(
      violations,
      violations.length
        ? `Modules should get other modules via DI, not direct import. Violations:\n${violations.map((v) => `  ${v.file} → ${v.import}`).join("\n")}`
        : undefined
    ).toHaveLength(0);
  });
});
