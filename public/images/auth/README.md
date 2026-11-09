# Pinna auth artwork

The supplied files in `public/` are already connected:

- `continue-witth-google-btn.png` — Google signup and sign-in.
- `continue-witth-password-bttn.png` — email sign-in and account creation.
- `continue-btn.png` — verification, recovery, password changes, and MFA.
- `profile-icon.webp` — name field.
- `lock.webp` — password fields.
- `left-chevron.webp` — back navigation.
- `dropdown-icon.webp` — portfolio and discovery select controls.
- `verified-check-icon.webp` — available for later verified-provider presentation; no verification claim is fabricated in this phase.

Existing filenames are preserved exactly, including spelling. All images are served locally. Buttons retain accessible action labels, keyboard focus, disabled and loading states, and an HTML fallback if artwork cannot load. The button ratio is approximately 817 × 120; export replacements at the same ratio.

To replace a button, overwrite its file or change the `source` map in `components/asset-button.tsx`. Avoid replacing an action-specific image with different wording; Google, email, and general Continue are intentionally mapped separately. The supplied Google artwork retains its coloured Google mark; the interface uses black, grey, and white.

The wordmark is in `components/brand.tsx`; replace it when the approved Pinna logo is supplied.
