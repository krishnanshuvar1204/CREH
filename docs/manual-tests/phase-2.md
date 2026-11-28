# Phase 2 manual checklist: Resource sharing core

Setup: `docker compose up -d`, then in `backend/`: `npm run migration:run && npm run seed && npm run dev`; in `frontend/`: `npm run dev`.
Curl examples use `B=http://localhost:5000/api` and `TA`/`TB` = access tokens of two **verified** users (A owns the item, B is a stranger). `TU` = an unverified user.
Image storage: with `CLOUDINARY_*` empty, photos go to local `backend/uploads/` (base64 via the API). With all three set, the browser uploads straight to Cloudinary using a signed ticket.

### P2-01a Migration on existing data
Steps: on a DB that has Phase 1 data with old-style listings (free-text category, `sharing_radius_km`, `image_url`), run `npm run migration:run`; then `select title, category, resource_type, sharing_radius_m, image_urls, availability from resources;`
Expected: succeeds; `Tools` -> `tools`, `Camping` -> `outdoors`, unknown text -> `other`; donations -> `DONATION`; km radii map to 500/1000/2000/5000 (rounded up, capped at 5000); old `image_url` is the first entry of `image_urls`. `npm run migration:revert` then `migration:run` also works.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-01b Validation of enums
Steps: `POST $B/resources` as A with `"category":"Tools"` (capitalised), then with `"sharing_radius_m":3000`.
Expected: both `400 Validation failed` naming the field. `GET $B/resources/options` lists the 7 categories, 2 types, 4 radii, max 5 images.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-02a Read / ownership
Steps: A creates an item (`category":"tools","sharing_radius_m":1000,"lending_duration_days":3,"location":{...}`). `GET $B/resources/<id>` without auth. As B: `PATCH` and `DELETE` that item.
Expected: GET works publicly and shows owner `id/name/reputation_score` only (no email). B gets `403` on PATCH and DELETE. Unknown id -> 404.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-02b Edit
Steps: as A, `PATCH` title/category/`resource_type:"DONATION"`/location; send `{}`.
Expected: changes returned; `is_donation` becomes true for DONATION; `{}` -> 400 "Nothing to update".
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-02c Pause / resume
Steps: A `PATCH {"availability":"UNAVAILABLE"}`; check `GET $B/resources/nearby?lat=..&lng=..&radiusKm=5`; then `{"availability":"AVAILABLE"}`. In the UI use Pause / Resume on My items.
Expected: paused item is absent from nearby and Discovery, present in A's "My items" with a **Paused** badge; resumed item reappears. While an exchange has the item RESERVED/BORROWED, pause returns 409 and the button is hidden.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-02d Soft delete
Steps: B requests A's item (pending). A deletes it (UI trash icon -> confirm, or `DELETE $B/resources/<id>`). Check B's dashboard and `select id, deleted_at from resources`.
Expected: 200; row still exists with `deleted_at` set; item gone from nearby, `GET /resources/<id>` is 404, and A's My items; B's pending request is now Declined and still visible in B's history with the item title. A second item with an ACCEPTED/ACTIVE request cannot be deleted (409 "exchange in progress").
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-03a Local image upload
Steps: UI: create/edit an item, add 1-5 photos. API: `POST $B/resources/<id>/images/sign` -> `{"provider":"local"}`; `POST $B/resources/<id>/images {"imageBase64":"data:image/png;base64,..."}`.
Expected: `image_urls` grows; photos render on Discovery and My items; a 6th photo -> 400 "at most 5"; B (non-owner) -> 403; `{"url":"https://evil.example/x.png"}` -> 400 "does not belong to our image storage"; sending both url and imageBase64 -> 400.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-03b Remove image
Steps: remove a photo in the edit form (X), save; or `DELETE $B/resources/<id>/images {"url":"/uploads/..."}`.
Expected: URL removed from `image_urls`; the local file returns 404. Removing a URL not on the item -> 404.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-03c Cloudinary signed upload (only if you have an account)
Steps: set `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, restart API, add a photo in the UI.
Expected: `images/sign` returns `provider:"cloudinary"` with `uploadUrl` and `fields` (no secret); the browser posts to `api.cloudinary.com`; saved URL is `https://res.cloudinary.com/<cloud>/...` and renders. Skip and note "not tested" if no account.
Result: [ ] Pass  [ ] Fail  [ ] Skipped   Tester/date:

### P2-04 Create / edit UI
Steps: Dashboard -> Share an item. Check: 7 categories, Lend/Donation, 4 radius buttons, duration hidden for donations, map pin (needs `VITE_MAPBOX_TOKEN`) or "Use my location", multi photo add/remove. Submit with no pin. Then Edit an item, change fields, save.
Expected: missing pin shows an inline error; success toast and the item appears under My items with category label, radius and photo count; edit pre-fills all fields and saves. Works at phone width.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-05 Verified users only
Steps: as unverified user `TU`: `POST $B/resources`, `PATCH` an item, `POST .../images`.
Expected: `403 EMAIL_NOT_VERIFIED` on create, edit and image add. Unverified users can still delete their own items.
Result: [ ] Pass  [ ] Fail   Tester/date:

### P2-06 Regression: Discovery
Steps: open Discovery; use the category chips; open an item with and without photos.
Expected: chips are the 7 fixed categories and filter correctly; the first photo shows on card and detail; the owner's sharing radius still limits who can see the item (an item with 500 m radius is not returned to a searcher 1 km away).
Result: [ ] Pass  [ ] Fail   Tester/date:
