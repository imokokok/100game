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
  assert.match(html, /<title>WHAT 100 PEOPLE DO TO A GAME<\/title>/i);
  assert.match(html, /href="\/concept\?public=1"/);
  assert.match(html, /href="\/\?access=invite"/);
  assert.doesNotMatch(html, /Owner 管理入口/);
  assert.match(html, /进入任务、问卷、文件与聊天/);
  assert.match(html, /© 2026 Huie Chen/);
  assert.doesNotMatch(html, /HuieChen/);
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

test("chat uses original project reaction marks with a working toggle request", async () => {
  const [api, flows, styles] = await Promise.all([
    readFile(new URL("../app/api/reactions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  for (const reaction of ["r-spark","r-pulse","r-orbit","r-bloom","r-echo"]) {
    assert.match(api, new RegExp(reaction));
    assert.match(flows, new RegExp(reaction));
  }
  assert.doesNotMatch(`${api}\n${flows}`, /👍|❤️|✨|🎮|👀/u);
  assert.match(flows, /response\?\.ok/);
  assert.match(flows, /aria-pressed=\{active\}/);
  assert.match(styles, /Original project reaction marks/);
  assert.match(styles, /touch-action:manipulation/);
});
