# Fetchx Documentation

This folder documents the product features and the shared implementation boundaries that support them. The source of truth is still the code, but these docs describe how the main pieces fit together so new work can land in the right place.

## Feature docs

- [Workspace](./features/workspace/README.md): request builder, collections, environments, ABI loading, request execution, saved responses, imports, and persistence.
- [GitHub workspaces](./features/workspace/github-workspaces.md): versioned repository storage for collection files.
- [GitHub workspaces](./features/workspace/github-workspaces.md): versioned repository storage for collection files.
- [AI request assistant](./features/workspace/ai-request-assistant.md): local-agent chat flow for creating or updating request drafts.
- [Desktop](./features/desktop/README.md): desktop-only update and close-guard feature surface.
- [Design system showcase](./features/design-system/README.md): route and components for the Flamingo design system demo.

## Shared docs

- [API services](./services/api.md): HTTP client, Fetchx service clients, REST execution, CORS proxy fallback, and error handling.
- [Stores](./stores/README.md): persisted Zustand stores for workspace, environments, RPCs, ABIs, and CORS state.

## Documentation rules

- Keep feature docs grouped by product capability, not by framework layer.
- When a feature uses shared stores or services, link to the shared doc instead of duplicating every detail.
- Update the nearest doc when changing behavior that future contributors need to preserve.
- Keep route files thin and point feature documentation at `src/features/*`, `src/store/*`, and `src/services/*`, matching [.agent/skills/code-convention.md](../.agent/skills/code-convention.md).

## Developer checks

Run `bun run convention:check` to list source files that violate the automated subset of the code convention: the 400-line source-file limit, explicit `any` types, raw Tailwind color utilities, and `fetch` calls outside service modules. It is report-only and always exits successfully. Use `bun run convention:strict` in CI when violations must fail the check. This complements Biome; it does not replace code review for architectural concerns that require human judgment.
