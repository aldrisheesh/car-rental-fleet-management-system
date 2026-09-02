# Domain Glossary

## Backup Run
One attempt to produce a recoverable protection set for the system. A Backup Run may produce multiple Backup Artifacts and has an overall outcome such as Completed, Partial, or Failed.

## Backup Artifact
One recoverable asset produced by a Backup Run. The baseline artifact types are Database and Storage.

## Database Backup Artifact
A logical backup of the canonical application database suitable for restoration through the supported database recovery procedure.

## Storage Backup Artifact
A protected copy of canonical application file-storage objects required to restore references to uploaded files.

## Recovery Set
The collection of Backup Artifacts from one Backup Run that together represents the system state intended for recovery.

## Recovery Drill
A controlled non-production exercise that proves a Recovery Set can be restored and validated.

## Recovery Point Objective
The target maximum age of recoverable data after a disaster. The capstone baseline target is 24 hours.

## Recovery Time Objective
The target time to restore service after a disaster, assuming required artifacts, credentials, and deployment access are available. The capstone baseline target is 4 hours.

## Business Owner/Admin
A business-domain application role that may inspect backup and recovery status. This role is not automatically a database or infrastructure administrator.

## Technical Recovery Operator
An authorized technical maintainer or database administrator responsible for backup infrastructure operations and actual restoration. This is not a normal application role.

## Backup Retention
The policy governing how long successful recovery sets are kept. The baseline is a rolling 14-day window while preserving at least the latest known-good recovery set.

## Low-Level Storage Reference
A non-secret logical key identifying a private backup artifact. It is not a signed URL, credential, or public download link.
