# Permission model

All authorization is enforced again on the server; hidden buttons are not security boundaries.

| Capability | Owner | Admin | Creator | Participant token | Public |
|---|---:|---:|---:|---:|---:|
| Read Home / Concept | yes | yes | yes | yes | yes |
| Manage project content, tasks, surveys and game links | yes | yes | yes | no | no |
| View dashboard and export project data | yes | yes | yes | no | no |
| Create a private group | **yes** | no | no | no | no |
| Assign or revoke Admin | **yes** | no | no | no | no |
| Read group messages/files | member only | member only | member only | member only | no |
| Submit assigned tasks/surveys/uploads | no | no | no | assigned token only | no |

Participant tokens are stored only as SHA-256 hashes, can expire or be revoked, and resolve to a limited participant session. Group queries always join through `group_members`. R2 objects are never public; download routes must validate ownership or group membership before issuing bytes. CSV exports are restricted to Owner/Admin and logged.
