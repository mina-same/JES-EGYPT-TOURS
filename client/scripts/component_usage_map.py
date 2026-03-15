#!/usr/bin/env python3
"""
Component Usage Map Generator

Scans client/src to identify:
- Used components (imported somewhere in the codebase)
- Unused components (not imported anywhere)
- Import graph (who imports what)

Usage:
    python3 client/scripts/component_usage_map.py

Outputs:
    - reports/component-usage-map.json (machine-readable)
    - reports/component-usage-map.md (human-readable)
"""

from pathlib import Path
import re
import json
from collections import Counter, defaultdict


def main():
    # Paths
    repo_root = Path("/Volumes/Data/work/JES EGYPT TOURS/JES EGYPT TOURS")
    client_src = repo_root / "client" / "src"
    components_root = client_src / "components"
    reports_dir = repo_root / "reports"
    reports_dir.mkdir(exist_ok=True)

    # Collect all component files
    print("Scanning component files...")
    comp_files = [p for p in components_root.rglob("*")
                  if p.is_file() and p.suffix in (".ts", ".tsx")]
    print(f"  Found {len(comp_files)} component files")

    # Import regex - matches both:
    #   import ... from '...'
    #   import '...'
    import_re = re.compile(
        r"\bfrom\s+['\"]([^'\"]+)['\"]|\bimport\s+['\"]([^'\"]+)['\"]"
    )

    # External packages to ignore
    external_prefixes = (
        "react", "next", "lucide", "@radix", "clsx", "tailwind",
        "react-", "@hookform", "zod", "date-fns", "swr", "axios",
        "@/lib", "@/types", "@/hooks", "@/data", "@/contexts"
    )

    def resolve_import(from_file: Path, spec: str) -> Path | None:
        """Resolve an import specifier to an actual file path."""
        if not spec:
            return None

        # Skip external packages
        if spec.startswith(external_prefixes):
            return None

        # Handle @/ alias
        if spec.startswith("@/"):
            target = client_src / spec[2:]
        # Handle relative imports
        elif spec.startswith("./") or spec.startswith("../"):
            target = (from_file.parent / spec).resolve()
        else:
            return None

        # Try resolution: .tsx, .ts, /index.tsx, /index.ts
        candidates = [
            target.with_suffix(".tsx"),
            target.with_suffix(".ts"),
            target / "index.tsx",
            target / "index.ts"
        ]
        for c in candidates:
            if c.exists() and c.is_file() and components_root in c.parents:
                return c
        return None

    # Scan all source files for imports
    print("Scanning imports across source files...")
    used_components = set()
    import_edges = []  # [{"from": str, "to": str}]
    entrypoints = []

    src_files = [p for p in client_src.rglob("*")
                 if p.is_file() and p.suffix in (".ts", ".tsx", ".js", ".jsx")]

    for src_file in src_files:
        # Check if this is an entrypoint (page or layout)
        rel_path = src_file.relative_to(client_src)
        is_entrypoint = (
            "page.tsx" in str(rel_path) or
            "layout.tsx" in str(rel_path) or
            "page.ts" in str(rel_path) or
            "layout.ts" in str(rel_path)
        )
        if is_entrypoint:
            entrypoints.append(str(rel_path))

        # Read and parse imports
        try:
            content = src_file.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        for match in import_re.finditer(content):
            spec = match.group(1) or match.group(2)
            resolved = resolve_import(src_file, spec)
            if resolved:
                used_components.add(resolved)
                import_edges.append({
                    "from": str(src_file.relative_to(client_src)),
                    "to": str(resolved.relative_to(components_root))
                })

    print(f"  Found {len(used_components)} used components")
    print(f"  Found {len(import_edges)} import edges")
    print(f"  Found {len(entrypoints)} entrypoints")

    # Identify unused components
    unused_components = [p for p in comp_files if p not in used_components]
    print(f"  Found {len(unused_components)} unused components")

    # Build stats by folder
    used_by_folder = Counter()
    unused_by_folder = Counter()

    for p in used_components:
        top_folder = p.relative_to(components_root).parts[0]
        used_by_folder[top_folder] += 1

    for p in unused_components:
        top_folder = p.relative_to(components_root).parts[0]
        unused_by_folder[top_folder] += 1

    # Build import graph (who imports each component)
    imported_by = defaultdict(list)
    for edge in import_edges:
        imported_by[edge["to"]].append(edge["from"])

    # Generate JSON output
    json_output = {
        "stats": {
            "total_component_files": len(comp_files),
            "used_components": len(used_components),
            "unused_components": len(unused_components),
            "total_import_edges": len(import_edges),
            "entrypoints_count": len(entrypoints),
            "by_folder": {
                folder: {
                    "used": used_by_folder.get(folder, 0),
                    "unused": unused_by_folder.get(folder, 0)
                }
                for folder in set(list(used_by_folder.keys()) + list(unused_by_folder.keys()))
            }
        },
        "used_components": sorted([
            str(p.relative_to(components_root)) for p in used_components
        ]),
        "unused_components": sorted([
            str(p.relative_to(components_root)) for p in unused_components
        ]),
        "import_edges": import_edges,
        "entrypoints": sorted(entrypoints),
        "imported_by": dict(imported_by)
    }

    json_path = reports_dir / "component-usage-map.json"
    json_path.write_text(
        json.dumps(json_output, indent=2, default=str),
        encoding="utf-8"
    )
    print(f"\n✓ JSON report: {json_path}")

    # Generate Markdown output
    md_lines = [
        "# Component Usage Map",
        "",
        "Generated by `client/scripts/component_usage_map.py`",
        "",
        "## Summary",
        "",
        f"| Metric | Count |",
        f"|--------|-------|",
        f"| Total Component Files | {len(comp_files)} |",
        f"| Used Components | {len(used_components)} |",
        f"| Unused Components | {len(unused_components)} |",
        f"| Total Import Edges | {len(import_edges)} |",
        f"| Entrypoints | {len(entrypoints)} |",
        "",
        "## By Folder",
        "",
        f"| Folder | Used | Unused | Total |",
        f"|--------|------|--------|-------|",
    ]

    all_folders = sorted(set(list(used_by_folder.keys()) + list(unused_by_folder.keys())))
    for folder in all_folders:
        used = used_by_folder.get(folder, 0)
        unused = unused_by_folder.get(folder, 0)
        total = used + unused
        md_lines.append(f"| {folder} | {used} | {unused} | {total} |")

    md_lines.extend([
        "",
        "## Unused Components (Full List)",
        "",
        f"**Total: {len(unused_components)} files**",
        "",
    ])

    # Group unused by top-level folder
    unused_by_folder_full = defaultdict(list)
    for p in unused_components:
        rel = p.relative_to(components_root)
        top = rel.parts[0] if rel.parts else "root"
        unused_by_folder_full[top].append(str(rel))

    for folder in sorted(unused_by_folder_full.keys()):
        files = sorted(unused_by_folder_full[folder])
        md_lines.extend([
            f"### {folder}/ ({len(files)} unused)",
            "",
        ])
        for f in files:
            md_lines.append(f"- `{f}`")
        md_lines.append("")

    md_lines.extend([
        "## Most Referenced Components",
        "",
    ])

    # Top 20 most imported components
    import_counts = Counter(edge["to"] for edge in import_edges)
    for comp, count in import_counts.most_common(20):
        md_lines.append(f"- `{comp}` - imported {count} times")
    md_lines.append("")

    md_path = reports_dir / "component-usage-map.md"
    md_path.write_text("\n".join(md_lines), encoding="utf-8")
    print(f"✓ Markdown report: {md_path}")

    print("\n" + "=" * 50)
    print("DONE!")
    print(f"  Used: {len(used_components)}")
    print(f"  Unused: {len(unused_components)}")
    print(f"  Check reports/ for full details")
    print("=" * 50)

    return json_output


if __name__ == "__main__":
    main()
