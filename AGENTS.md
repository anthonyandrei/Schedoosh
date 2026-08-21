# Schedoosh - Agent Guidelines

## Repository & Git Configuration
- **Canonical Repository**: `anthonyandrei/Schedoosh` (GitHub).
- **Upstream Note**: The repository was forked from `CyberEzpertz/Schedaddle`. All PRs, issues, and git commands **MUST target `anthonyandrei/Schedoosh`**, never `CyberEzpertz/Schedaddle`.
- **Default `gh` remote**: Set to `origin` (`anthonyandrei/Schedoosh`). When opening or managing PRs with GitHub CLI, ensure the base is `main` on `anthonyandrei/Schedoosh`.

## Commands & Workflows
- **Test**: `bun test src`
- **Lint**: `npm run lint` (Biome check)
- **Format**: `npx @biomejs/biome format --write src`
- **Build**: `npm run build`
- **Dev**: `npm run dev`

## Code Conventions
- **Professor Names**: Always use `formatProfessorName` from `@/lib/utils` to format instructor names as `Last, First` (proper-cased).
- **ArcherEye URLs**: Always use `getArcherEyeUrl` from `@/lib/utils` which generates slugs in the format `https://archer-eye.com/professor/firstname-lastname`.

## Key Decisions & Architecture
- **Data Models & Scraper**: `Schedule.date` is an empty sentinel for repeating weekly classes; multi-room same-slot bookings merge into a single `Schedule` at parse time. Duplicate `COURSE_CREATION_IDs` merge via `.filter()` to prevent section dropping.
- **Modality & Custom Classes**: Modality is derived dynamically from schedule toggles via `deriveModality()` in `@/lib/utils`. Class edit forms carry `type`, `units`, and `variant` through zod schemas without stripping.

## Active Context
- PR #3 (`fix/custom-class-form-archershub-fields`) open on `anthonyandrei/Schedoosh`.
- Pending: rotate ArchersHub session cookie; Google Calendar RRULE export verification; icon-only button `aria-label` accessibility pass.

