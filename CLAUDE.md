# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EasyRisparmio Dashboard — an energy/utility savings comparison and management platform. Features include client management, case management, meter reading, offer comparisons, supplier management, agreements, referrals, support tickets, commission tracking, and CSV reconciliation.

## Commit Guideline
 - never use `Co-Authored-By: Claude` or something like this.
 - always commit and push after your work
 - commit message should be in the format: `feat: add new feature` or `fix: fix bug` etc.
 - use conventional commits.
 - never commit everything at once, do commit for each feature, module or fix. always follow conventional commits, principles and standards. always make sure your changes are tested before committing.
 
 
## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — TypeScript check (`tsc -b`) then Vite production build
- `npm run lint` — ESLint across the project
- `npm run preview` — Preview production build locally

## Tech Stack

- **React 19** + **TypeScript 5.8** + **Vite 7**
- **Ant Design 5** for UI components, themed via `src/lib/antTheme.ts` (primary color: `#7061ED`)
- **Tailwind CSS 4** for utility styling (via `@tailwindcss/vite` plugin)
- **Redux Toolkit + RTK Query** for state management and API caching
- **React Router 7** with `createBrowserRouter`

## Architecture

### Routing

Two layout groups configured in `src/routes/index.tsx`:
- **Main layout** (`/`) — all authenticated dashboard pages, routes auto-generated from `src/constants/router.constants.tsx` via `routesGenerators()` helper
- **Auth layout** (`/auth`) — SignIn, ForgotPassword, VerifyEmail, ResetPassword

### State Management

- Redux store: `src/redux/store.ts`
- Typed hooks: `src/redux/hooks.ts` (`useAppDispatch`, `useAppSelector`)
- Auth slice: `src/redux/features/Auth/authSlice.ts` — manages user/token state with `setLogin`, `setUser`, `logout` actions
- RTK Query base API: `src/redux/api/baseApi.ts` — auto-injects Bearer token from Redux auth state, base URL from `VITE_SERVER_URL` env var

### Key Directories

- `src/app/` — Feature pages, each in its own folder (e.g., `Suppliers/`, `ClientManagement/`)
- `src/components/` — Shared/reusable components; `home/` subfolder has dashboard card widgets
- `src/layouts/` — `Main/` (dashboard with header + sidebar) and `Auth/` (auth pages)
- `src/redux/` — Store, slices, API definitions
- `src/lib/` — Providers (`MainProvider` wraps Redux + Ant Design ConfigProvider), theme config, helpers
- `src/types/` — Shared TypeScript types (ROLE enum, TProfile, sidebar types)
- `src/utils/` — Utilities (`cn.ts` for classnames, `debounce.ts`, `api.ts`)
- `src/constants/` — Route definitions (`dashboardItems`), language constants
- `src/config/` — Environment config (`server_url` from `VITE_SERVER_URL`)

### Common Patterns

- **Pages**: Functional components using `useState` for local modal state, `useNavigate` for routing, Ant Design components for tables/forms/buttons, Tailwind for layout
- **Modals**: Ant Design `Modal` + `Form` with validation, controlled by local `useState`
- **API calls**: RTK Query mutations/queries injected into feature-specific API slices extending `baseApi`
- **Icons**: `lucide-react` for sidebar icons, `react-icons` for UI elements
- **Alerts**: `sweetalert2` for confirmation dialogs (`src/lib/helpers/sweetAlertConfirmation.ts`)

## Environment

- `.env.development` and `.env.production` define `VITE_SERVER_URL`
- Access env vars via `import.meta.env.VITE_*`
