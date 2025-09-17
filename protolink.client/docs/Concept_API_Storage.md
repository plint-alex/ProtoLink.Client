### Entity-Centric API Storage – Core Concept

This legacy application models everything as entities connected in a graph. Content, users, UI views, and application data are stored uniformly with values and relationships, then exposed via a small API surface and rendered with dynamic views.

### Building blocks

- **Entity**: The universal record type. Every domain object (user, page, view, asset entry, business data) is an entity with a unique ID and metadata (e.g., code, creation time, version).
- **Value**: A typed attribute attached to an entity. Supported value types include `StringValue`, `DoubleValue`, `DateTimeValue`, `FileValue`, `IntValue` (extensible). Values may reference other entities via value-level `parents`.
- **Relationships**: Entities form a directed acyclic or cyclic graph via:
  - `mainParentId` (primary parent pointer)
  - Additional parent links (multi-parent supported) → overall structure is a graph, not a strict tree.
- **Views**: UI components are also stored as entities. The view script (TypeScript/JSX) is a string value (`viewScriptValue`) attached to the view entity. An entity may map to one or more view IDs that define how it should render.
- **Files**: Binary assets linked to entities (e.g., images). Managed via file endpoints and referenced in values or views.

### Why a graph of entities?

- **Uniformity**: Users, content, configs, and UI are represented the same way—no special tables per domain.
- **Flexibility**: Multi-parent links enable hierarchies, cross-cutting taxonomies, and reusable components.
- **Composability**: Views can query and compose other entities. Admin tooling manipulates the same model used at runtime.

### API overview (capabilities)

- **Entities**
  - Read: `GetEntity`, `GetEntities` with filters (by IDs, parents, paging), short in-memory caching.
  - Write: `AddEntity`, `UpdateEntity`, `DeleteEntity`.
  - Relations: `AddParent`, `RemoveParent` (and `AddPermission`).
  - View resolution: `GetView/{id}` returns `{ Scripts, EntityViews }` for dynamic rendering.
- **Files**
  - Upload/replace: `addFile`.
  - Fetch/stream: `getFile/{id}[/{fileName}]` and batch `getFiles`.
  - Delete: `deleteFile`.
- **Authentication**
  - Sessions via JWT + refresh tokens: `Login`, `refreshtoken`, `logout`, `Register`, `ConfirmEmail`.

### Dynamic rendering pipeline

- The client (Home page) requests `GET api/Entities/GetView/{entityId}`.
- The server resolves mapped `viewId`s for the target entity, fetches each view script value, replaces `window['{id}']` with the concrete `viewId`, transpiles TS/JSX to JS, concatenates into `Scripts`, and returns it along with `EntityViews`.
- The client evaluates `Scripts`, then renders `window[viewId]` as a React component with props such as `entityId`, `entityViews`, `location`, `level`.
- Only a curated set of libraries/utilities is exposed as globals on `window` (wired in `App.js`), and dynamic components must import from there.

### Data modeling guidelines

- **Design entities first**: Each conceptual object → one entity. Choose stable `code` for human-readable lookup.
- **Attach typed values**: Use primitive types for simple fields; use `FileValue` for assets; reference other entities via value `parents` for contextual relationships.
- **Link the graph**: Use `mainParentId` for primary placement; add additional parents to express taxonomy, ownership, or reuse.
- **Define views**: Create view entities holding the component source under `viewScriptValue`. Map target entities to their views so `GetView` can resolve and deliver them.

### Managing and presenting data

- **Admin UI**: Create/update entities, set `mainParentId`, manage additional parents, add/remove `viewIds`, manage values (with full-screen editor for complex text), and handle files (upload/preview/delete). Navigate parents/children to curate the graph.
- **Runtime UI**: Home page loads the relevant view for the current entity context, renders it, and allows smooth navigation to Admin for edits.

### Typical use cases

- CMS-like pages: Entities as pages; values hold content; view maps to page component.
- Product catalog: Entities for categories and products; multi-parent for cross-listing; values for attributes; files for images.
- User profiles: Users as entities with profile values; views render profile UI.
- Configurable widgets: View components as entities; composed on pages via mappings.

### Notes on scalability and consistency

- Short-lived caching on read APIs reduces load; clients can set `fromCache=false` for freshness.
- Graph flexibility is powerful—establish clear conventions for `mainParentId`, taxonomy parents, and reference parents at value level.
- Keep view scripts small and rely on `window` globals to avoid bundling external deps at runtime.

### Demo Entity

- **Demo entity ID**: `e03cf9df-e1f6-4b60-aaee-1656ef656981`
- **Resolvable demo view via**: `GET /api/Entities/GetView/e03cf9df-e1f6-4b60-aaee-1656ef656981`
- **Client URL**: `http://localhost:3000/e03cf9df-e1f6-4b60-aaee-1656ef656981`

### Debugging & Console Logs

The system now includes automatic console log collection for debugging:

- **Console Logs**: `GET /api/web/console-logs` - All browser console output
- **Console Errors**: `GET /api/web/console-errors` - Filtered error messages only
- **Detailed Logs**: `GET /api/web/detailed-logs` - API calls and actual errors
- **Network Requests**: `GET /api/web/network-requests` - All network activity

**Common Issues**:
- **500 Internal Server Error**: Usually indicates proxy configuration issues
- **React Identifier Conflicts**: "Identifier 'React' has already been declared" - dynamic view script conflicts
- **Syntax Errors**: "Unexpected token '<'" - JSX parsing issues in dynamic scripts

**Debugging Workflow**:
1. Navigate to entity page: `POST /api/automation/complete-workflow`
2. Capture console logs: `GET /api/web/console-logs`
3. Analyze errors and fix accordingly