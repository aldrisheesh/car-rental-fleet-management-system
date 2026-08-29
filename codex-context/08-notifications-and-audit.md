# Notifications and Audit

**Status:** Pending Specification  
**Last updated:** 2026-08-24

## Notification Categories Already in Scope

- booking updates
- payment reminders
- verification results
- vehicle return schedules
- maintenance reminders
- low vehicle availability

## Still To Define

For every notification:

- trigger event
- recipient role/user
- delivery channel
- timing
- repeat/reminder behavior
- read/unread behavior
- failure handling

## Audit Requirements

The manuscript includes audit logging/data structures, but the exact list of auditable events remains to be frozen.

Potential sensitive events requiring explicit review include:

- authentication/security events
- requirement verification
- protected-document access where appropriate
- payment verification
- booking approval/rejection
- vehicle assignment/branch changes
- maintenance updates
- return settlement
- user/role changes
- forecasting/recommendation administrative actions

Do not treat the potential list above as final until this document is Frozen.
