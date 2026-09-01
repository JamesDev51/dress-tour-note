# QA notes

The production-candidate branch includes 25 generated individual option WebPs, a shared 720×1280 raster person base, fast recoverable PDF trailers, explicit save-before-navigation behavior for face positioning, and offline precache verification for the mobile shell and every local image.

The final browser gate allows enough time for client-side Korean font embedding, raster dress rendering, PDF generation, Blob capture, and cross-device-style restoration to complete on a cold CI runner. Offline behavior is verified against the exact precached `index.html` shell, 25 option WebPs, and person base. It also checks 320px/390px Korean wrapping, no retired visible questions, independent shoulder/neckline persistence, and absolute metadata.
