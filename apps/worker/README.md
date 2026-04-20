## lore-worker

Cloudflare Worker that gates the lore context behind license key validation (Polar).

### Endpoints

**`POST /validate`**

```json
{ "key": "your-license-key" }
```

Returns `{ "ok": true }` if the key is active, error otherwise.

**`GET /context`**

```
Authorization: Bearer your-license-key
```

Returns the context text from KV if the key is valid.

---

### Setup

**1. Install dependencies**

```bash
npm install
```

**2. Log in to Cloudflare**

```bash
wrangler login
```

**3. Create the KV namespace**

```bash
wrangler kv namespace create CONTEXT
# paste the returned id into wrangler.jsonc → kv_namespaces[0].id
```

**4. Set the Polar access token secret**

```bash
wrangler secret put POLAR_ACCESS_TOKEN
```

Token needs `license_keys:read` scope. Create it in the Polar dashboard under **Settings > General > Developers**.

**5. Upload context content**

```bash
# Edit context.md (gitignored), then:
npm run kv:put
```

**6. Deploy**

```bash
npm run deploy
```

---

### Local dev

Copy `.dev.vars.example` → `.dev.vars` and fill in your values.

```bash
npm run dev
```

Available at `http://localhost:8787`.
