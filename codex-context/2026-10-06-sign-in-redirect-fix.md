# Sign-in catalog flash fix

The credential flow invoked onAuthenticated and onOpenChange(false) before its role-based hard navigation. GeneralSignIn interprets dismissal as cancellation and starts a client navigation to /vehicles; SelectedCarSignIn similarly returns to the vehicle detail. That navigation competed with the intended admin redirect and exposed customer content briefly.

SignInDialog now completes authentication through completeSignIn. Redirecting flows navigate once while keeping the sign-in surface mounted. Only in-place customer authentication refreshes the parent and dismisses the dialog. Registration uses the same completion rule. Admin/staff destination selection, customer booking context, cancellation, OAuth session handling and server authorization remain unchanged. No Supabase SDK, cookie, database, or permissions changes.

Validation: eight auth destination/role-context tests passed, including regression callbacks that would cause a catalog detour. Targeted ESLint and production build passed. Browser verified that explicit cancellation still returns to /vehicles. Successful admin sign-in was verified through regression tests rather than a live credential submission; no admin credentials were used or accounts changed.
