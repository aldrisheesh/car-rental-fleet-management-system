# Sign-in entrance replay fix

Typing switched the root input modality to keyboard. Global keyboard CSS removed the hero and auth-dialog keyframe animations. A pointerdown restored those animation declarations and restarted the hero image, hero text, date finder, auth backdrop, and auth dialog entrances. Carousel pausing and callback memoization did not address that CSS replay.

Replaced those entrance keyframes with transitions and @starting-style. Starting styles run when a surface is first rendered, not when input modality changes. Keyboard transitions remain instant, reduced-motion disables these transitions, and embedded authentication keeps its existing layout. Removed the former keyboard animation override for these surfaces.

Verified the local popup through repeated Tab and interior mouse-click cycles without changing existing email/password values. All five elements retained opacity 1, final transforms, and animation-name none after each cycle. Motion-preference tests: 3 passed. Production build passed. Evidence: output/transfer-review-redesign/signin-no-replayed-entrances.png.
