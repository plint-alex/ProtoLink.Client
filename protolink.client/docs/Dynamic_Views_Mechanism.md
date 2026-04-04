### Dynamic Views Mechanism – How server-delivered components render on the client

This document explains how the legacy app serves dynamic pages via API and renders them on the client using window-bound globals. It references:

- Client bootstrap: `Web/ClientApp/src/App.js`
- Home page renderer: `Web/ClientApp/src/components/pages/HomePage/HomePage.js`
- Example component: `Web/ClientApp/src/components/pages/TestPage/TestPage.js`
- Server endpoint: `Web/Controllers/Entities/EntitiesController.cs` → `GetView`

### High-level flow

1) Client navigates to Home with an entity context (`/:id` or host).
2) Home checks cache and calls `loadViewScript(entityId)` if needed.
3) The client requests `GET api/Entities/GetView/{id}`.
4) Server resolves view mappings for the entity and concatenates compiled scripts.
5) Server returns `GetViewsResult`:
   - `EntityViews`: array of `{ entityId, viewId }`
   - `Scripts`: JavaScript string that, when executed, registers components on `window['<viewId>']`.
6) Client evaluates `Scripts`, then reads `window[viewId]` to obtain a React component and renders it.

### Server: `GetView`

- Route: `GET api/Entities/GetView/{id}` (AllowAnonymous)
- For each mapping `(EntityId, ViewId)` returned by `IEntitiesService.GetViews(id)`:
  - Fetches the view script source from a string value: `GetValues(ViewId, [viewScriptValueId], String)`.
  - Rewrites placeholder: replaces `window['{id}']` with `window['<actual ViewId>']`.
  - Transpiles TypeScript/JSX to JS via `JsxToJs` (JavaScriptEngineSwitcher + Babel presets: `typescript`, `react`, `minify`; plugins include `proposal-class-properties`, `proposal-object-rest-spread`).
  - Appends the transpiled code to `result.Scripts`.
- Returns `{ Scripts, EntityViews }`. Results are cached briefly in-memory.

### Server: ES module import rewrite and allowlist

Before TypeScript/JSX transpile, `GetView` rewrites a **subset** of ES module syntax to `window[...]` assignments:

- `import React from 'react'` becomes `const React = window['React']`.
- `import { Box } from '@mui/material'` becomes `const Box = window['Box']` (and similar for other `@mui/*` / `mui` imports resolved to globals on the host).
- `export default MyComponent` becomes `window['{id}'] = MyComponent` (the server then substitutes the real view GUID for `{id}`).
- A **single-line** `export default function Name(...)` is rewritten to `function Name(...)` plus a trailing `window['{id}'] = Name`.

**Allowed module specifiers** (anything else returns HTTP 422 from `GetView` / `GetViewScriptSimple`):

- `react`
- `mui`
- `@mui/*` (e.g. `@mui/material`)

**Not allowed:** side-effect-only imports such as `import 'react'` (use a binding import instead). Type-only lines `import type ...` are stripped.

If a full component cannot use a one-line `export default function ...`, declare the function first, then add a final line `export default MyComponent`.

### Client bootstrap: globals on `window`

In `protolink.client/src/App.tsx`, selected libraries and app utilities are exposed on `window` so dynamic views can use the rewrite above:

- `window['react'] = React` and `window['React'] = React`
- `window['redux'] = { bindActionCreators }`, `window['react-redux'] = { connect }`
- `window['query-string'] = queryString`, `window['redux-form'] = { Field, reduxForm }`
- `window['@material-ui/styles'] = { ThemeProvider, withStyles }`
- `window['@material-ui/core/<Component>'] = <Component>` (e.g., `Container`, `Button`, etc.)
- `window['@material-ui/icons/<Icon>'] = <Icon>`
- `window['internal'] = { apiRequest, Controls: { renderTextField }, Store: { AuthenticationActionCreators, EntitiesActionCreators } }`

Dynamic components must only use these globals.

### Authoring a dynamic component (in DB)

- Write the component source (TypeScript/JSX supported) that assigns itself to `window['{id}']`.
- Use only globals provided on `window`.
- Example (see TestPage):

```javascript
const React = window['react'];
const { connect } = window['react-redux'];
const { withStyles } = window['@material-ui/styles'];
const Container = window['@material-ui/core/Container'];
const { apiRequest } = window['internal'];

const styles = theme => ({ paper: { marginTop: theme.spacing(8) } });

class UserPage extends React.Component {
  async componentDidMount() {
    const entity = await apiRequest(`entities/getEntity/${this.props.entityId}`, 'GET');
    this.setState({ entity });
  }
  render() { /* render from this.state.entity */ }
}

const Styled = withStyles(styles)(connect(() => ({}), () => ({}))(UserPage));
window['{id}'] = Styled;
```

- At runtime, the server will replace `'{id}'` with the concrete `viewId`, so the component registers as `window['<viewId>']`.

### Client rendering on HomePage

- Home computes `entityId` and calls `loadViewScript(entityId)` if `entityViews[entityId]` is missing.
- After `GetView` returns, the client evaluates `Scripts` and caches `EntityViews` under `entityViews[entityId]`.
- It picks the first view mapping and does:
  - `const TagName = window[viewId];`
  - Renders `<TagName level={0} location={location} entityId={resolvedEntityId} entityViews={entityViews[resolvedEntityId]} />`.

### Constraints and best practices

- Only use APIs exposed via `window` in `App.js`.
- Always export by assigning to `window['{id}']` (not ES module exports).
- Avoid dynamic imports or external URLs; scripts are concatenated server-side.
- Keep components defensive: verify props (`entityId`, `entityViews`) and handle loading states.
- Prefer fetching via `window['internal'].apiRequest` for consistency.

### Troubleshooting

- Component not rendering: confirm `EntityViews` contains a `viewId` for the entity and that `window[viewId]` exists after script evaluation.
- Runtime errors about missing modules: ensure you only reference globals that `App.js` wires to `window`.
- Wrong component binding: verify the server replaced `window['{id}']` to the expected `viewId` and caching didn’t serve stale scripts.
