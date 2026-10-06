# Motion pass two

Scope: homepage fleet carousel and customer/admin mobile navigation. Builds on pass one's keyboard and reduced-motion policy. No data or booking workflow changes.

- Replaced the 560 ms carousel reveal/remount with stable gallery containers and an interruptible 220 ms Web Animations transition using only opacity and an 8 px directional translation. Rapid changes start from the current visual state. Keyboard actions skip movement; keyboard input and reduced-motion changes cancel active movement.
- Added a visible Pause/Resume control. Explicit pause, mouse hover and focus have independent state. Focus moving inside the showcase keeps autoplay paused. Autoplay waits six seconds, stops while the document is hidden or reduced motion is enabled, and restarts with a fresh interval when eligible. Automatic changes do not announce the counter.
- Customer and admin mobile menus share 180 ms entrance / 120 ms exit transitions with discrete display support and @starting-style. Closed menus remain hidden and inert. Unsupported browsers fall back to instant display changes. Existing customer 900 px and admin 1024 px breakpoints are preserved; no height animation.

Validation: production build and targeted ESLint passed; three motion-preference tests passed. Browser verification covered pause persistence after leaving the carousel, resume/autoplay, manual previous/next, keyboard navigation, 390 px menu opening, Escape focus return, hidden/inert states, instant keyboard menu opening and no horizontal overflow. Admin menu uses the same CSS but was not exercised in an authenticated browser. OS reduced motion was verified through existing preference-change unit tests and source review, not by changing the user's system preference.
