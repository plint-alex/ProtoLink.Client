### Legacy API – Overview, Endpoints, and Use Cases

This document summarizes the legacy API exposed by `EntityStorage2/Web/Controllers`. It groups endpoints by controller and describes what users can do and common use cases. Base route prefix for all controllers is `api/<Controller>`.

### AuthenticationController (`api/Authentication`)

- **POST `Login`**: Authenticate with credentials.
  - **Body**: `LoginContract` (login, password, optional GiveinPlaceId, etc.)
  - **Response**: `LoginResult` with `AccessToken` (JWT), `RefreshToken` (GUID), `UserId`, `UserName`, `ExpirationTime`, `IdleTimeout`, `Error` (if any)
  - **Access**: AllowAnonymous
  - **Use cases**: User sign-in, obtain tokens for subsequent requests.

- **POST `logout`**: Invalidate the current session (server-side logout).
  - **Auth**: Requires bearer token
  - **Response**: `{}`
  - **Use cases**: Explicit user logout / token invalidation.

- **POST `refreshtoken`**: Exchange an expired (or near-expiry) `AccessToken` with a valid `RefreshToken` for a new pair.
  - **Body**: `RefreshTokenContract` with `AccessToken`, `RefreshToken`
  - **Response**: `RefreshTokenResult` with new `AccessToken`, `RefreshToken`, `ExpirationTime`
  - **Access**: AllowAnonymous (token is validated internally)
  - **Use cases**: Silent token refresh to keep user signed in.

- **POST `Register`**: Register a new user.
  - **Body**: `RegisterContract`
  - **Query**: `lang`
  - **Response**: `{}`
  - **Access**: AllowAnonymous
  - **Use cases**: New user onboarding/registration flows.

- **GET `ConfirmEmail/{userId}/{token}`**: Confirm user email.
  - **Route params**: `userId` (GUID), `token` (GUID)
  - **Response**: `{ ok: boolean }`
  - **Access**: AllowAnonymous
  - **Use cases**: Email verification links.

### EntitiesController (`api/Entities`)

- **GET `GetEntity/{id}`**: Fetch a single entity by ID.
  - **Route params**: `id` (GUID)
  - **Query**: `version?`, `lang?`, `fromCache=true|false` (default true)
  - **Response**: `GetEntityResult`
  - **Access**: AllowAnonymous
  - **Use cases**: Public entity fetch for rendering pages, details, or previews.

- **POST `GetEntities`**: Batch fetch entities by various selectors.
  - **Body**: `GetEntitiesContract` with filters: `Ids`, `IdsToFindParents`, `ParentIds`, `Skip`, `Take?`
  - **Query**: `fromCache=true|false` (default true)
  - **Response**: `List<GetEntitiesResult>`
  - **Access**: AllowAnonymous
  - **Use cases**: Load parents/children, resolve references, paginate listings.

- **POST `AddEntity`**: Create a new entity (returns its ID).
  - **Body**: `AddEntityContract`
  - **Auth**: Requires bearer token
  - **Response**: `{ id: GUID }`
  - **Use cases**: Admin creates a child/root entity.

- **POST `UpdateEntity`**: Update an existing entity (returns new version).
  - **Body**: `UpdateEntityContract`
  - **Auth**: Requires bearer token
  - **Response**: `{ version: number }`
  - **Use cases**: Admin updates fields, values, relationships.

- **POST `DeleteEntity`**: Delete an entity.
  - **Body**: `DeleteEntityContract`
  - **Auth**: Requires bearer token
  - **Response**: `{}`
  - **Use cases**: Remove obsolete entities.

- **POST `AddParent`**: Add a parent relationship to an entity.
  - **Body**: `AddParentContract`
  - **Auth**: Requires bearer token
  - **Response**: `{}`
  - **Use cases**: Establish hierarchy/graph relationships.

- **POST `RemoveParent`**: Remove a parent relationship from an entity.
  - **Body**: `RemoveParentContract`
  - **Auth**: Requires bearer token
  - **Response**: `{}`
  - **Use cases**: Adjust or clean up relationships.

- **POST `AddPermission`**: Add a permission to an entity.
  - **Body**: `AddPermissionContract`
  - **Auth**: Requires bearer token
  - **Response**: `{}`
  - **Use cases**: Assign access rights or roles at entity-level.

- **GET `GetView/{id}`**: Resolve view mappings and return aggregated view scripts for the view ID.
  - **Route params**: `id` (string)
  - **Query**: `lang?`
  - **Response**: `GetViewsResult` with `Scripts` and `EntityViews[]`
  - **Access**: AllowAnonymous
  - **Use cases**: Client-side rendering widgets/components based on server-defined views.

### FilesController (`api/Files`)

- **POST `addFile`**: Upload a file for an entity.
  - **Form-data**: `AddFileContract` (`File` stream, `EntityId` GUID, `MimeType` derived, optional `FileId`)
  - **Auth**: Requires bearer token
  - **Response**: `{ Success: "ok" }`
  - **Notes**: Replaces an existing file (calls delete then add) per implementation.
  - **Use cases**: Attach/replace images or assets on an entity.

- **GET `getFile/{id}`** and **GET `getFile/{id}/{fileName}`**: Download/stream a file.
  - **Route params**: `id` (GUID), optional `fileName`
  - **Access**: AllowAnonymous
  - **Response**: File stream with appropriate `Content-Type` and download name
  - **Use cases**: Public asset delivery (images, documents).

- **POST `getFiles`**: Batch query for files.
  - **Body**: `GetFilesContract` with `EntityIds?`, `Ids?`, `Types?`
  - **Access**: AllowAnonymous
  - **Response**: `List<FileResult>` with `Id`, `EntityId`, `MimeType`, `Type`
  - **Use cases**: Preload thumbnails or fetch asset metadata for grids/lists.

- **POST `deleteFile`**: Delete a file by ID.
  - **Body**: `DeleteFileContract` with `FileId`
  - **Auth**: Requires bearer token
  - **Response**: `{ Success: "ok" }`
  - **Use cases**: Admin removes outdated or incorrect files.

### Authentication and Caching Notes

- Endpoints marked AllowAnonymous are callable without a token; others require a valid JWT in the `Authorization: Bearer <token>` header.
- Entities endpoints use short-lived in-memory caching keyed by request parameters to reduce load; `fromCache=false` forces a fresh fetch.

### Typical User Journeys

- **Sign in and maintain session**: `Login` → use token → `refreshtoken` as needed → `logout` to end.
- **Browse and render content**: `GetEntity`/`GetEntities`/`GetView` to assemble pages and components.
- **Admin content management**: `AddEntity`/`UpdateEntity`/`DeleteEntity`, relate with `AddParent`/`RemoveParent`, assign with `AddPermission`.
- **Asset workflows**: `addFile` to upload, `getFile`/`getFiles` to display, `deleteFile` to clean up.
