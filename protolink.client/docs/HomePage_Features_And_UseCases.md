### Home Page – Features and Use Cases

This document summarizes what users can do on the legacy Home page (`EntityStorage2/Web/ClientApp/src/components/pages/HomePage/HomePage.js`) and the typical scenarios it supports.

- **Overview**: The Home page serves dynamic, entity-driven content and provides a global header with navigation, search input, and authentication controls.

### Core Features

- **Automatic routing and localization**
  - If no `:id` is present in the route and the user is authenticated, it redirects to the user’s `userId` as the current entity context.
  - Ensures a `lang` query parameter is present (defaults to the browser language), updating the URL if missing.

- **Dynamic view rendering**
  - Resolves and loads a server-provided view script for the current entity via `loadViewScript(entityId)`.
  - When available, dynamically renders a component from `window[viewId]` with props: `level`, `location`, `entityId`, and `entityViews` for the resolved entity.

- **Global header**
  - Shows brand title (“Entity Store”).
  - Provides a search input (visual only in legacy code; no search dispatch is wired in the snippet).
  - Displays current user name when authenticated.
  - Quick links:
    - **Admin**: Goes to `/admin/{resolvedEntityId}?{params}` preserving or adapting query parameters.
    - **Login**: When not authenticated, navigates to `/login` with `lang` and `returnUrl`.
    - **Logout**: When authenticated, triggers logout action.

### Behavioral Details

- **Entity context resolution**
  - Entity ID is taken from route `/:id` or fallback to `window.location.host`.
  - On mount and when the entity context changes, requests the view script if not already cached in `entityViews`.

- **Navigation params**
  - Maintains `lang` throughout navigation; builds `returnUrl` for login and strips `lang` for admin link when present.

### Typical Use Cases

- **Dynamic landing pages**: Serve different content/widgets per entity (e.g., tenant/site/page) rendered from server-managed view scripts.
- **Personalized default route**: Authenticated users land on their own entity context automatically.
- **Localized browsing**: The page keeps a consistent `lang` setting across navigations.
- **Seamless admin access**: Jump from the current content context straight into the Admin page for editing.
- **Session control**: Clear login/logout affordances and user display in the header.

### Notes

- The search bar in this legacy snippet is a styled input without bound actions. Hook it to a query action to enable full-text or entity search.
- `entityViews` cache determines whether a view is already loaded; missing entries trigger `loadViewScript` which uses the server API (`GET api/Entities/GetView/{id}`) to deliver component scripts.
