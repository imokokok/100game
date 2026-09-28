# Production release

The public website is https://www.100game.art (100game.art redirects here).
It is deployed by **Vercel from imokokok/100game main**. The historical ChatGPT
Sites hostname is a separate deployment; publishing there does not update this domain.
Do not change production DNS to solve a content-version mismatch.

## Release checks

1. Preserve collaborators' main; work from current main, never force push.
2. Run `npm run build` (or `npx next build --webpack` for a local Windows junction).
3. Start the build and run `node scripts/check-production-release.mjs http://localhost:3017`.
4. Check 320px/390px and desktop layout, language switching, image close/Escape,
   navigation and survey draft restoration in a browser.
5. Push the tested commit, wait for Vercel success, then run
   `node scripts/check-production-release.mjs https://www.100game.art`.
6. Compare GitHub main SHA, the deployment status and the `X-100game-Release`
   response header. A GitHub push alone is not deployment proof.

## September 28 optimization

- Clean `/process` route with 20 records across weeks 0–3 and bilingual downloads.
- Original files and author attribution are preserved. Week 0 original-only
  documents are explicitly labeled, not presented as translated.
- No forced opening film; visitors may play it deliberately.
- Consistent white/ink/red layout with mobile navigation and readable archive cards.
- Language stored in a cookie and local storage; server-rendered language avoids
  Chinese-first flashes on full-page navigation, and one provider synchronizes
  embedded content. Original documents and author names are not silently translated.
- Image lightbox supports close, backdrop and Escape, with restored focus.
- Existing PostgreSQL, Blob storage, authentication and private access rules remain.

The smoke test only reads public content and verifies anonymous requests are rejected.
It does not create production questionnaire responses or test logged-in write workflows.
