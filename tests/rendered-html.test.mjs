import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path="/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${path}`, {headers:{accept:"text/html"}}),
    {ASSETS:{fetch:async()=>new Response("Not found",{status:404})}},
    {waitUntil(){},passThroughOnException(){}},
  );
}

test("server-renders the real access page and resilient links", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>WHAT 100 PEOPLE DO TO A GAME \/ 一百个人怎么做游戏<\/title>/i);
  assert.match(html, /href="\/concept"/);
  assert.match(html, /href="\/\?access=invite"/);
  assert.doesNotMatch(html, /Owner 管理入口/);
  assert.match(html, /创作者协作区/);
  assert.match(html, /© 2026 HuieChen/);
});

test("invited participants can create and immediately join chat groups", async () => {
  const [groupsApi, flows, studio, concept] = await Promise.all([
    readFile(new URL("../app/api/groups/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(groupsApi, /if \(!participant && !ownerView\)/);
  assert.match(groupsApi, /\[participant, \.\.\.requestedMembers\]/);
  assert.match(groupsApi, /canCreate: true/);
  assert.match(groupsApi, /default_channel_id/);
  assert.match(groupsApi, /defaultChannel:/);
  assert.match(flows, /u\.createChat/);
  assert.match(flows, /u\.loading/);
  assert.match(flows, /function GroupFileGallery/);
  assert.match(flows, /className="imageLightbox"/);
  assert.doesNotMatch(flows, /target="_blank" rel="noreferrer"><b>{file\.name}/);
  assert.match(flows, /canCreate&&<button className="addServer"/);
  assert.doesNotMatch(flows, /Owner 登录并创建小组/);
  assert.match(studio, /worktopLead/);
  assert.match(concept, /className="publicBack" href="\/"/);
});

test("language switching uses complete local copy without an online translator", async () => {
  const [locale, ui, studio, concept, flows] = await Promise.all([
    readFile(new URL("../app/locale-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/ui-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
  ]);
  for (const language of ["zh","en","ja","es","fr","ar","hi","bn","sw","ha","id","pt"]) {
    assert.match(locale, new RegExp(`(?:^|\\s)${language}:\\{`, "m"));
    assert.match(ui, new RegExp(`(?:^|\\s)${language}:\\{`, "m"));
  }
  assert.match(concept, /c\.essay\.map/);
  assert.match(concept, /c\.headline\[0\]/);
  assert.match(flows, /const u=uiCopy\[lang\]/);
  assert.doesNotMatch(studio, /\/ LANGUAGE/);
  assert.doesNotMatch(`${locale}\n${ui}\n${studio}\n${concept}\n${flows}`, /translate\.google|deepl|libretranslate|microsofttranslator/i);
});

test("keeps the wordmark weights and public name consistent", async () => {
  const [wordmark, studio, concept, migration] = await Promise.all([
    readFile(new URL("../app/wordmark.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0010_fix_huie_chen_name.sql", import.meta.url), "utf8"),
  ]);
  assert.match(wordmark, /<span>WHAT<\/span><strong>100<\/strong>/);
  assert.match(wordmark, /<strong>PEOPLE<\/strong><span> DO TO A <\/span><strong>GAME<\/strong>/);
  assert.match(wordmark, /<span>WHAT <\/span><strong>100 PEOPLE<\/strong><span> DO TO A <\/span><strong>GAME<\/strong>/);
  assert.match(studio, /<Wordmark stacked\/>/);
  assert.match(concept, /<Wordmark\/>/);
  assert.match(migration, /SET `name` = 'Huie Chen'/);
  assert.doesNotMatch(migration, /SET `name` = 'HuieChen'/);
});

test("keeps background tabs quiet and uses the shared workspace theme", async () => {
  const [studio, flows, styles] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(studio, /document\.visibilityState!=="visible"/);
  assert.match(flows, /document\.visibilityState==="visible"/);
  assert.match(styles, /Unified participant workspace/);
  assert.match(styles, /html\{scroll-behavior:auto\}/);
  assert.match(styles, /\.communityPage,\.discordEmpty\{background:var\(--paper\)/);
});

test("chat has no reactions and waits for live data before choosing a screen", async () => {
  const [flows, styles] = await Promise.all([
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(`${flows}\n${styles}`, /reactionRow|projectReaction|ReactionGlyph|r-spark|👍|❤️|✨|🎮|👀/u);
  assert.match(flows, /groupsLoaded/);
  assert.match(flows, /finally\(\(\)=>setGroupsLoaded\(true\)\)/);
  assert.match(flows, /if\(!groupsLoaded\|\|/);
  assert.match(styles, /chatInitialLoading/);
});

test("keeps management and participant records behind server authorization", async () => {
  const [studio, questionnaire, leadResponses, leadLogin, proxy] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/questionnaire/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/lead/responses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/lead/login/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../proxy.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(studio, /params\.get\("creator"\)/);
  assert.match(questionnaire, /participantId\(req\)/);
  assert.match(questionnaire, /Invitation required/);
  assert.match(leadResponses, /private, no-store/);
  assert.match(leadLogin, /safeEq/);
  assert.match(proxy, /X-Content-Type-Options/);
  assert.match(proxy, /X-Frame-Options/);
  assert.match(proxy, /Permissions-Policy/);
});

test("keeps the public entry lightweight and defers the workspace", async () => {
  const [layout, page, entry, workspace, studio, css] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/entry-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/workspace/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(layout, /PortfolioMotion/);
  assert.doesNotMatch(layout, /ClickFeedback/);
  assert.match(page, /<EntryStudio\s*\/>/);
  assert.doesNotMatch(entry, /\.\/i18n|\.\/locale-copy|live-flows|workspace-files/);
  assert.match(entry, /location\.replace\(data\.role==="lead"\?"\/lead":"\/workspace"\)/);
  assert.match(workspace, /<Studio\s*\/>/);
  assert.match(studio, /location\.pathname!=="\/workspace"/);
  assert.match(studio, /import \{WorkspaceFiles\} from "\.\/workspace-files"/);
  assert.doesNotMatch(studio, /lazy\(\(\)=>import\("\.\/workspace-files"\)/);
  assert.match(studio, /workspaceHomeButton/);
  assert.match(studio, /x\.value==="zh"\|\|x\.value==="en"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /selectionPop/);
  assert.match(css, /Motion communicates state and direction/);
  assert.match(css, /Editorial contrast: richer without decorative motion/);
  assert.match(css, /Mature studio system: hierarchy first, decoration removed/);
  assert.match(css, /entryGate:not\(\.inviteGate\):before/);
  assert.match(css, /\.conceptQuestions\{max-width:none/);
  assert.match(css, /\.conceptStandalone \.conceptEssay\{display:grid;grid-template-columns:repeat\(2/);
  assert.match(css, /Mobile keeps the desktop information hierarchy/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.publicPage \.top>\.mark\{display:block!important/);
});

test("keeps public pages bilingual", async () => {
  const concept = await readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8");
  assert.match(concept, /x\.value==="zh"\|\|x\.value==="en"/);
});

test("keeps supporting interface text legible", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Readability pass/);
  assert.match(css, /\.gateInvite label>span\{font-size:13px/);
  assert.match(css, /\.copyright,\.entryGate>\.copyright,\.publicPage>\.copyright\{[^}]*font-size:12px/);
  assert.match(css, /\.weekFolder small,\.categoryFolder small\{[^}]*font-size:14px/);
  assert.match(css, /input::placeholder,textarea::placeholder\{color:#6b6963;opacity:1\}/);
});
