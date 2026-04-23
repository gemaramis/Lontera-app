# Security Specification for Nexus

## Data Invariants
- A User can only edit their own profile.
- A Server can only be edited by the Owner.
- Channels belong to a Server; only the Server Owner can manage channels.
- Messages can only be sent/read by members of the Server.
- Messages are immutable once sent (for now, or only editable by author).
- Call signals can only be read/written by the participants of the call.

## The "Dirty Dozen" Payloads (Deny Cases)
1. Creating a User profile with someone else's UID.
2. Updating a Server name as a non-owner.
3. Sending a Message to a Server the sender is not a member of.
4. Reading Messages of a Server you are not a member of.
5. Deleting a Channel as a regular member.
6. Updating a Message content as a different user.
7. Reading call signals where neither `from` nor `to` matches the user.
8. Creating a User profile with `status: 'admin'` (privilege escalation).
9. Injecting 1MB of text into a Channel name.
10. Spoofing `createdAt` with a past/future client timestamp.
11. Modifying memberships of a server you don't own.
12. Creating a Server where `ownerId` doesn't match the requester.

## Test Runner (Logic)
- Use `request.auth.uid` comparison for owner/author/self.
- Use `exists(/databases/$(database)/documents/servers/$(serverId)/members/$(request.auth.uid))` for membership checks.
- Use `request.time` for timestamps.
- Use `size()` limits on strings.
