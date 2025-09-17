### Admin Page – Features and Use Cases

This document summarizes what users can do on the Admin page (based on the legacy `EntityStorage2` Admin UI) and outlines practical use cases. The corresponding modern files live under `src/pages/AdminPage/` in this project.

- **Overview**: The Admin area is split into two main parts:
  - **Entity editor**: View and edit a single entity, its attributes, relationships, and files.
  - **Hierarchy manager**: Navigate an entity’s parents and children, add/remove relationships, and manage child entities.

### Core Features

- **Navigate entities**
  - Click parent/child rows to open that entity.
  - Jump to root when no parents are available.
  - Copy any entity ID to the clipboard from the list.

- **Edit entity details**
  - View current entity metadata: ID, creation time, version.
  - Update basic fields like `code` and `mainParentId`.
  - See the resolved label (e.g., `code`) for referenced parent entities.

- **Manage views (`viewIds`)**
  - See the list of attached `viewIds`.
  - Add a view by entering its ID.
  - Remove any existing view.
  - See friendly labels for referenced views when available.

- **Manage values**
  - Add/remove values (each value has a `type` and a `value`). Supported types include: `StringValue`, `DoubleValue`, `DateTimeValue`, `FileValue`, `IntValue`.
  - Open any value in a full-screen code editor with syntax highlighting for easier editing of complex text/JSON/markup.
  - For each value, manage associated parent references (`parents`): add a parent ID or remove existing ones. Friendly labels are shown when known.

- **Files management**
  - See the list of files attached to the current entity (e.g., images) with previews.
  - Upload a new file for the entity.
  - Delete any attached file.

- **Hierarchy management (parents/children)**
  - Parents:
    - Add a parent by entering its ID.
    - Remove an existing parent.
    - Copy a parent’s ID and navigate to a parent entity.
  - Children:
    - View the list of child entities.
    - Add a new child entity under the current one.
    - Remove a child entity from the current parent.
    - Copy a child’s ID and navigate to a child entity.

### Typical Use Cases

- **Content modeling**: Model a catalog, site map, or knowledge graph by linking entities with parents, children, and views.
- **Data curation**: Edit entity attributes and structured values, including large/complex text via the editor dialog.
- **Asset management**: Attach, preview, and prune files associated with an entity.
- **Reference maintenance**: Quickly navigate the graph, copy IDs, and update `mainParentId`, `viewIds`, or value-level `parents`.
- **Incremental authoring**: Add child entities and iteratively enrich them with values, relationships, and assets.

### Notes

- The code editor uses syntax highlighting for JSX/markup/JavaScript-like content and is suitable for rich text, JSON, or templated snippets.
- The UI resolves IDs to readable labels (such as `code`) when the referenced entity is present in the client cache; otherwise only the ID is shown.
