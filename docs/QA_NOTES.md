# QA notes

The production-candidate branch includes generated option artwork, fast recoverable PDF trailers, explicit save-before-navigation behavior for face positioning, and offline precache verification for the mobile shell and image atlas.

The final browser gate allows enough time for client-side Korean font embedding, dress rendering, PDF download, and cross-device-style restoration to complete on a cold CI runner. Offline behavior is verified against the exact precached `index.html` shell and generated WebP artwork.
