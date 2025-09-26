# Dynamic View Scripts – Authoring Guide

Compact, complete rules for creating dynamic pages that render in the client.

## Do this

- Export a component via `window['{id}']` (the server replaces `{id}` with the actual view id):

  ```javascript
  (function () {
    var React = window.React, el = React.createElement;
    window['{id}'] = function MyView(props) {
      return el('div', null, 'Hello dynamic view');
    };
  })();
  ```

- Prefer plain JS with `React.createElement`. If you use JSX, ensure it compiles cleanly; avoid mixing JSX inside back‑ticked strings.

- Load data inside React hooks:
  - Fetch once per entity: `useEffect(() => { /* fetch */ }, [props.entityId]);`
  - Guard reruns with a ref if needed to ensure single execution per `entityId` in dev re‑mounts.

- Provide stable keys for list items:

  ```javascript
  values.slice(0, 6).map(function(v, idx){
    var k = (v && v.id != null) ? String(v.id) : ('i-' + idx);
    return el('li', { key: k }, String(v && v.id), ': ', String(v && v.value));
  });
  ```

- Be defensive with nulls and types:
  - Arrays: `Array.isArray(x) ? x : []`
  - Strings: `String(x ?? '')`

- Useful endpoints:
  - `GET /api/entities/getEntity/:id`
  - `POST /api/entities/getEntities` with `{ parentIds?, idsToFindParents?, skip?, take? }`

## Don’t do this

- Don’t use `import`/`export`, top‑level `await`, or other ESM features in scripts.
- Don’t redeclare React/ReactDOM; use `window.React` and `window.ReactDOM` provided by the host.
- Don’t include raw `</script>` inside strings; escape as `<\/script>`.
- Don’t place fetches outside `useEffect`, and don’t omit dependency arrays.

## Minimal template

```javascript
(function () {
  var React = window.React, el = React.createElement;

  function Card(title, body) {
    return el('div', { style: { marginBottom: 16 } },
      el('div', { style: { padding: 16, border: '1px solid #eee', borderRadius: 12, background: '#fff' } },
        title ? el('div', { style: { fontWeight: 600, marginBottom: 8 } }, title) : null,
        body));
  }

  window['{id}'] = function View(props) {
    var id = (props && props.entityId) || '';
    var useState = React.useState, useEffect = React.useEffect, useRef = React.useRef;
    var s = useState({ entity: null }), st = s[0], setSt = s[1];
    var ran = useRef(null);

    useEffect(function(){
      if (ran.current === id) return; // guard re-renders in dev
      ran.current = id;
      fetch('/api/entities/getEntity/' + id)
        .then(function(r){ return r.json(); })
        .then(function(e){ setSt({ entity: e }); })
        .catch(function(){});
    }, [id]);

    return el('div', { id: 'home-root', style: { padding: 24 } },
      Card('Entity', el('div', null, String(st.entity && st.entity.id || '—'))));
  };
})();
```

## Common pitfalls and fixes

- `SyntaxError: Invalid regular expression flags`
  - Usually from an unintended `</script>` in strings or malformed regex literals in code.
  - Escape closing tags (`<\/script>`). Prefer `new RegExp()` over regex literals inside script strings.

- `Each child in a list should have a unique "key"` warning
  - Supply deterministic `key` props on all list items (see example above).

- Duplicate requests on re‑render
  - Keep fetches inside `useEffect([props.entityId])` and guard with a ref if Strict Mode re‑mounts occur in dev.

## Quick checklist

- [ ] Export with `window['{id}']`
- [ ] Fetch in `useEffect([entityId])` with ref guard if needed
- [ ] Stable `key` in lists
- [ ] No `import`/`export`, no raw `</script>`
- [ ] Handle nulls/arrays robustly


