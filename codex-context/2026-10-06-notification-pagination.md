# Notification inbox pagination

Customer and admin notification pages share NotificationInbox in src/components/notifications/NotificationsPanel.tsx. Each now shows ten notifications per page with an item range, page count, and Previous/Next buttons. Filtering happens before pagination and changing categories resets to page one. Refresh and marking read retain the current page; the displayed page clamps to the available range. Page changes move focus and scroll instantly to the updates heading for keyboard and screen-reader continuity.

Unread totals, category counts, bindings, email preferences, API ordering, and notification persistence remain unchanged. Pagination applies to full inbox pages, not the compact admin summary. This is display pagination over the existing API response; it does not change API retrieval limits.

Validation: notification and operational-notification tests passed (21), targeted component ESLint passed, production build passed. Customer browser checks covered ten-row pages, last-page boundary, three-row final filtered page, category reset, refresh, keyboard navigation, empty category, single-page disabled controls, and mobile width without overflow. Admin uses the same component; live admin login was not exercised. No notification read states or preferences were changed during QA.

Screenshot: output/transfer-review-redesign/notifications-pagination.png.
