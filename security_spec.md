# Security Specification for Meat Products Production Tracking

## 1. Data Invariants
- An order MUST NOT be created or updated by unauthenticated sessions or sessions without verified emails.
- An order's ID must conform strictly to `YYMMDD-NNN` rules (strings of size exactly 10, matched by `^[0-9]{6}-[0-9]{3}$`).
- Immutable fields: `id` and `createdAt` must never change once written.
- Quantitative inputs (`qty`, `fgKg`, `sfgKg`, `batterKg`, and stage counts) must always be non-negative real/integer values with strict size upper bounds.
- System admin roles can only be validated through `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` or the bootstrapped runtime email `advancegroup.dcc@gmail.com` with verification.

---

## 2. The "Dirty Dozen" Payloads
These payloads attempt to breach identity, integrity, state machine constraints, or resource allocation limits:

1. **Anonymous Write Attack (Unauthenticated)**: Trying to write an order from a null `request.auth` context.
2. **Unverified Email Spoofing**: Trying to write an order with a valid UID, but `email_verified == false` on the auth token.
3. **Privilege Escalation**: Attempting to create a document inside the `/admins/` collection.
4. **Id Poisoning (Resource Exhaustion)**: Injecting a 2MB string as the document ID path variable to crash or swell database indices.
5. **ID Mismatch Hijack**: Setting the payload field `id` to `260603-002` while targeting `/orders/260603-001`.
6. **Timeline Tampering (Client Clock)**: Providing a client-generated date or backdated timestamp for `createdAt` instead of `request.time`.
7. **Negative Output Poisoning**: Attempting to set `qty` or `mixingCount` to `-500` or a non-numeric type.
8. **Immutability Breach**: Updating an existing order's `id` or `createdAt` fields.
9. **State Machine Shortcut**: Direct injection or modification of `status` to an invalid or system-only state without proper step transition checks.
10. **Shadow Key Exploitation (Shadow Fields)**: Creating an order with unlisted extra keys like `isAdminUser: true` or `bypassVerification: true`.
11. **Malicious ID Regex Injection**: Using special characters (e.g. `../` or `%20`) to initiate directory traversal or query hijacking within the document ID.
12. **Admin-Claim Spoofing**: Overwriting are-you-admin flags if placed inside custom fields on the user's profile.

---

## 3. Simulated Verification Assertions
All of the defined "Dirty Dozen" payloads are guaranteed to trigger `PERMISSION_DENIED` errors by our Firestore configuration security rules, which strictly evaluate types, sizes, regex IDs, authentication tokens, and field immutabilities before allowing any operation.
