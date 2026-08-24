import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
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
  assert.match(html, /© 2026 HuieChen\. 版权所有。/);
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

test("keeps invitation secrets out of the portable source and preserves returning sessions", async () => {
  const [migration, accessRoute] = await Promise.all([
    readFile(new URL("../drizzle/0019_finalize_invitation_policy.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/api/access/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(migration, /Historical invitation rotation omitted/);
  assert.doesNotMatch(migration, /token_hash/);
  assert.match(accessRoute, /String\(code\?\?""\)\.trim\(\)/);
  assert.match(accessRoute, /participantHeaders\.set\("cookie",participantCookie\)/);
});

test("requires Hera and the lead code together while isolating participant sessions", async () => {
  const [shared, accessRoute, leadLogin, dashboard] = await Promise.all([
    readFile(new URL("../app/api/_shared.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/access/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/lead/login/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/lead/lead-dashboard.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(shared, /export const LEAD_NAME = "Hera"/);
  assert.match(shared, /safeEq\(submittedName,LEAD_NAME\)&&safeEq\(submittedCode,expectedCode\)/);
  assert.match(shared, /const payload=`\$\{LEAD_NAME\}\.\$\{expiry\}`/);
  assert.match(shared, /if\(parts\.length!==3\)return false/);
  assert.match(accessRoute, /validLeadCredentials\(name,value\)/);
  assert.match(accessRoute, /clearLeadSession\(res\)/);
  assert.match(leadLogin, /validLeadCredentials\(name,code\)/);
  assert.match(dashboard, /JSON\.stringify\(\{name,code\}\)/);
  assert.match(dashboard, /姓名 \/ Name/);
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
  assert.match(leadLogin, /validLeadCredentials/);
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
  assert.match(entry, /location\.replace\(data\.role==="lead"\?"\/workspace\?view=journal":"\/workspace"\)/);
  assert.match(workspace, /<Studio initialParticipant=\{participant\} initialRole=\{role\} initialView=\{initialView\} initialResponses=\{initialResponses\}\/>/);
  assert.match(workspace, /participantId\(request\)/);
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
  assert.match(css, /\.conceptStandalone \.conceptEssay\{display:grid;grid-template-columns:minmax\(0,820px\);gap:30px\}/);
  assert.match(css, /Mobile keeps the desktop information hierarchy/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /\.publicPage \.top>\.mark\{display:block!important/);
});

test("keeps public pages bilingual", async () => {
  const concept = await readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8");
  assert.match(concept, /x\.value==="zh"\|\|x\.value==="en"/);
});

test("states resource equality and universal creative agency in both languages", async () => {
  const concept = await readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8");
  assert.match(concept, /任何人都可以做游戏/);
  assert.match(concept, /阶级位置与资源占有/);
  assert.match(concept, /重新分配进入、表达与决定的权利/);
  assert.match(concept, /Anyone can make a game/);
  assert.match(concept, /Class position and control of resources/);
});

test("keeps supporting interface text legible", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Readability pass/);
  assert.match(css, /\.gateInvite label>span\{font-size:13px/);
  assert.match(css, /\.copyright,\.entryGate>\.copyright,\.publicPage>\.copyright\{[^}]*font-size:12px/);
  assert.match(css, /\.weekFolder small,\.categoryFolder small\{[^}]*font-size:14px/);
  assert.match(css, /input::placeholder,textarea::placeholder\{color:#6b6963;opacity:1\}/);
});

test("keeps invitation placeholders visible on narrow screens", async () => {
  const [entry, studio, css] = await Promise.all([
    readFile(new URL("../app/entry-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(entry, /namePlaceholder:"填写微信群聊名"/);
  assert.doesNotMatch(`${entry}\n${studio}`, /填写你在群里使用的名字|Name used in the group/);
  assert.match(css, /-webkit-text-size-adjust:100%/);
  assert.match(css, /\.gateInvite label\{min-width:0\}/);
  assert.match(css, /\.gateInvite input\{font-size:15px!important;padding-inline:14px\}/);
});

test("keeps public back navigation visually lightweight", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Public navigation stays quiet/);
  assert.match(css, /\.publicPage \.top>\.publicBack\{[^}]*border:0!important;[^}]*background:transparent!important/);
  assert.match(css, /\.publicPage \.top>\.publicBack:focus-visible\{[^}]*outline:2px solid #c72d24/);
});

test("keeps entry cards free of redundant arrows", async () => {
  const [entry, studio] = await Promise.all([
    readFile(new URL("../app/entry-studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
  ]);
  const entryChoices = entry.match(/className="entryChoices">([\s\S]*?)<\/div><\/section>/)?.[1] ?? "";
  assert.ok(entryChoices);
  assert.doesNotMatch(entryChoices, /<i>→<\/i>/);
  assert.doesNotMatch(studio, /className="entryChoices"/);
});

test("keeps the bilingual client payload lean and overlaps workspace loading", async () => {
  const [studio, flows, concept, i18n, locale, ui] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/bilingual-i18n.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/bilingual-locale-copy.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/bilingual-ui-copy.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(`${studio}\n${flows}\n${concept}`, /from ["']\.\.?\/i18n["']|from ["']\.\.?\/locale-copy["']|from ["']\.\.?\/ui-copy["']/);
  assert.match(i18n, /export type Language = "zh" \| "en"/);
  assert.doesNotMatch(`${i18n}\n${locale}\n${ui}`, /\bja\s*:|\bes\s*:|\bfr\s*:/);
  assert.match(studio, /function preloadView\(view:View,role:WorkspaceRole\)/);
  assert.match(studio, /if\(view==="survey"\)void \(role==="lead"\?loadLeadResponses\(\):loadSurvey\(\)\)/);
  assert.doesNotMatch(studio, /fetch\("\/api\/participant"/);
});

test("keeps Top 5 Games as an owner-upload status instead of a participant form", async () => {
  const [tasks, notice, legacyNotice, migration, css] = await Promise.all([
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/week-announcement.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/project-announcement.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0016_top_five_owner_upload.sql", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(tasks, /task\?\.id==="week0-top-five-games"/);
  assert.match(tasks, /这里不需要再次填写/);
  assert.match(tasks, /请等待主策划 Hera 整理并上传至网站/);
  assert.match(notice, /等待整理上传：Top 5 Games/);
  assert.doesNotMatch(`${notice}\n${legacyNotice}`, /Complete your Top 5 Games now|Choose your five favourite games/);
  assert.match(migration, /`status` = 'owner_pending'/);
  assert.match(migration, /等待主策划整理上传/);
  assert.match(css, /\.taskOwnerPending\{/);
});

test("opens the participant survey inside the workspace without a page refresh", async () => {
  const [studio, survey, css] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/survey/survey-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(studio, /const EmbeddedSurvey=lazy/);
  assert.match(studio, /<LiveTasks t=\{t\} lang=\{lang\} onOpenSurvey=\{\(\)=>selectView\("survey"\)\}\/>/);
  assert.match(studio, /view==="survey"&&\(role==="lead"\?<LeadResponses initialRows=\{initialResponses\}\/>:<EmbeddedSurvey embedded\/>\)/);
  assert.doesNotMatch(studio, /location\.href=participant\?"\/survey"/);
  assert.match(survey, /SurveyApp\(\{embedded=false\}/);
  assert.match(survey, /embeddedSurvey/);
  assert.match(css, /\.workspace \.embeddedSurvey\{min-height:0/);
});

test("gives the Week 0 proposal and participant survey their real task flows", async () => {
  const [flows, css] = await Promise.all([
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(flows, /const digitalProposal=task\?\.id==="week0-digital-proposal"/);
  assert.match(flows, /提案说明（可选）/);
  assert.match(flows, /Digital Proposal \/ 电子提案（可选）/);
  assert.match(flows, /可参考群公告整理提案/);
  assert.match(flows, /const participantSurvey=task\?\.id==="week0-participant-survey"/);
  assert.match(flows, /title_zh\.includes\("参与者信息问卷"\)/);
  assert.match(flows, /title_en\.toLowerCase\(\)\.includes\("participant survey"\)/);
  assert.match(flows, /href="\/workspace\?view=survey"/);
  assert.match(flows, /event\.preventDefault\(\);onOpenSurvey\(\)/);
  assert.match(flows, /fetch\("\/api\/tasks",\{cache:"no-store"\}\)[\s\S]*\.finally\(\(\)=>setLoaded\(true\)\)\},\[\]\)/);
  assert.doesNotMatch(flows, /function shortError\(lang:Language\)\{return translations\[lang\]\.tasks\.auto\}/);
  assert.match(css, /\.workspaceHomeButton\{max-width:132px;overflow:visible;text-overflow:clip/);
  assert.match(css, /\.creatorTaskAction\{/);
});

test("keeps the production photo journal readable to creators and editable only by the lead", async () => {
  const [journalApi, shared, participantApi, flows, migration, schema, css] = await Promise.all([
    readFile(new URL("../app/api/journal/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/_shared.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/participant/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/live-flows.tsx", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0017_professional_photo_journal.sql", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(shared, /export async function isLead/);
  assert.match(participantApi, /isOwner\(req\)\|\|await isLead\(req\)/);
  assert.match(journalApi, /async function canEdit/);
  assert.match(journalApi, /if\(!participant&&!editor\)/);
  assert.match(journalApi, /if\(!\(await canEdit\(req\)\)\)return NextResponse\.json\(\{error:"Only the Lead Designer can publish journal entries"/);
  assert.doesNotMatch(journalApi, /const participant=await participantId\(req\);if\(!participant&&!isOwner\(req\)\).*formData/);
  assert.match(journalApi, /export async function PATCH/);
  assert.match(flows, /PRODUCTION PHOTO JOURNAL/);
  assert.match(flows, /\{canEdit&&<section className="journalEditor"/);
  assert.match(migration, /ADD `body_zh`/);
  assert.match(migration, /idx_journal_entries_stage_occurred/);
  assert.match(schema, /bodyZh:text\("body_zh"\)/);
  assert.match(css, /\.productionEntry\{/);
});

test("keeps workspace navigation refresh-safe and gives the lead the correct extra views", async () => {
  const [studio, participantApi, leadResponsesApi, css, entry] = await Promise.all([
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/participant/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/lead/responses/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/entry-studio.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(studio, /const LeadResponses=lazy/);
  assert.match(studio, /const target=next==="home"\?"\/workspace":`\/workspace\?view=\$\{next\}`/);
  assert.match(studio, /history\.pushState\(\{view:next\},"",target\)/);
  assert.match(studio, /window\.addEventListener\("popstate",sync\)/);
  assert.match(studio, /if\(requested&&!allowed\)history\.replaceState\(\{view:"home"\},"","\/workspace"\)/);
  assert.match(studio, /role==="lead"\?views:views\.filter\(id=>id!=="dashboard"\)/);
  assert.match(studio, /view==="dashboard"&&role==="lead"/);
  assert.match(participantApi, /role: row \? "participant" : null/);
  assert.match(leadResponsesApi, /!isOwner\(req\)&&!await isLead\(req\)/);
  assert.match(css, /Mobile navigation and filter rails remain complete without browser scrollbars/);
  assert.match(entry, /busy\?c\.entering:c\.verify/);
});

test("returns to workspace home once and resets the rendered scroll surface", async () => {
  const studio = await readFile(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /const workspaceRef=useRef<HTMLElement>\(null\)/);
  assert.match(studio, /if\(next===view\)return/);
  assert.match(studio, /if\(`\$\{location\.pathname\}\$\{location\.search\}`!==target\)history\.pushState/);
  assert.match(studio, /requestAnimationFrame\(\(\)=>\{window\.scrollTo\(\{top:0,behavior:"auto"\}\);workspaceRef\.current\?\.scrollTo/);
  assert.match(studio, /section className="workspace" ref=\{workspaceRef\}/);
  assert.match(studio, /disabled=\{view==="home"\}/);
  assert.match(studio, /返回创作资料/);
});

test("uses one editorial system instead of assembling the interface from rounded cards", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Editorial direction: hierarchy comes from typography, rhythm and contrast/);
  assert.match(css, /\.survey-shell \.question,\.survey-shell \.question\.answered\{[^}]*border-radius:0!important;[^}]*background:transparent!important;[^}]*box-shadow:none!important/);
  assert.match(css, /\.weekFolder,\.driveFolder,\.categoryFolder,\.categoryFolder:nth-child\(2n\)\{[^}]*border-radius:0!important;[^}]*background:transparent!important;[^}]*box-shadow:none!important/);
  assert.match(css, /\.lead-shell \.response-card\{[^}]*border-radius:0;[^}]*background:transparent;[^}]*box-shadow:none!important/);
  assert.match(css, /\.entryChoices \.entryChoice,\.entryChoices \.entryChoice:first-child,\.entryChoices \.entryChoice:nth-child\(2\)\{[^}]*grid-template-columns:minmax\(180px,.55fr\)/);
});

test("reflows the mobile workspace without tiny navigation or controls covering questions", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Mobile comfort pass: reflow controls instead of squeezing the desktop interface/);
  assert.match(css, /\.app>aside nav\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\);grid-template-rows:repeat\(2,minmax\(46px,1fr\)\)/);
  assert.match(css, /\.survey-shell \.step-actions\{position:static\}/);
  assert.match(css, /\.survey-shell \.question,\.survey-shell \.question\.answered\{grid-template-columns:1fr!important/);
  assert.match(css, /\.journalFilters\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.worktop \.privacy\{display:none\}/);
});

test("presents the survey centre as a restrained project register", async () => {
  const [hub, css] = await Promise.all([
    readFile(new URL("../app/survey/survey-hub.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(hub, /surveyHubStatement/);
  assert.match(hub, /surveyIndex/);
  assert.match(hub, /surveyStatus/);
  assert.match(hub, /surveyCta/);
  assert.match(hub, /返回项目入口/);
  assert.doesNotMatch(hub, /返回创作者协作区/);
  assert.doesNotMatch(hub, /<strong>\{zh\?"进入问卷"/);
  assert.match(hub, /© 2026 HuieChen/);
  assert.match(css, /Survey register: one coherent red, white and black editorial system/);
  assert.match(css, /Glass survey direction: depth replaces grids, dividers and stacked cards/);
  assert.match(css, /backdrop-filter:blur\(28px\) saturate\(140%\)/);
  assert.match(css, /Neumorphic survey system: fixed top-left light, soft clay surfaces/);
  assert.match(css, /--neu-raised:8px 8px 16px #c4bdb3,-8px -8px 16px #ffffff/);
  assert.match(css, /--neu-inset-focus:inset 2px 2px 4px #c4bdb3,inset -2px -2px 4px #ffffff/);
  assert.match(css, /Project red is the only interaction accent across the survey surface/);
});

test("uses the same neumorphic system for the public and invitation entry", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Neumorphic entry system: the public gate now shares the survey language/);
  assert.match(css, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(css, /\.entryChoices \.entryChoice:active\{box-shadow:inset 4px 4px 8px #c4bdb3,inset -4px -4px 8px #ffffff!important/);
  assert.match(css, /\.gateInvite input:focus\{box-shadow:inset 2px 2px 4px #c4bdb3,inset -2px -2px 4px #ffffff!important/);
});

test("shares the neumorphic system across public pages, workspace and lead tools", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Site-wide neumorphic unification: one surface, one light source, one accent/);
  assert.match(css, /\.app>aside\{background:#e8e2d8!important/);
  assert.match(css, /\.publicPage \.top\{[\s\S]*background:#e8e2d8!important/);
  assert.match(css, /\.conceptStandalone>\.conceptLabelBlock\{[\s\S]*background:#e8e2d8!important;[\s\S]*color:#9f211a!important;[\s\S]*box-shadow:inset 3px 3px 6px/);
  assert.match(css, /\.conceptStandalone \.conceptHeadlineLine\.accent\{color:#c72d24!important\}/);
  assert.match(css, /\.conceptQuestions\{[^}]*padding:clamp\(36px,5vw,64px\)/);
  assert.match(css, /\.workspace input:not\(\[type="file"\]\)[\s\S]*box-shadow:var\(--neu-inset\)!important/);
  assert.match(css, /\.lead-login form,\.lead-shell \.filters,\.lead-shell \.response-card,\.profile-sheet/);
  assert.match(css, /Entry card palette: public is red, invitation is black/);
  assert.match(css, /\.entryChoices \.entryChoice:first-child,[\s\S]*background:#c72d24!important/);
  assert.match(css, /\.entryChoices \.entryChoice:nth-child\(2\),[\s\S]*background:#171715!important/);
  assert.match(css, /Publication-style copyright line/);
  assert.match(css, /letter-spacing:\.02em/);
  assert.match(css, /\.libraryWeeks \.weekFolder\{padding-inline:clamp\(20px,3vw,32px\)!important\}/);
});

test("uses a warm stone surface instead of pale blue-grey", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--neu-bg:#e8e2d8/);
  assert.match(css, /--neu-soft:#f5f1ea/);
  assert.match(css, /--neu-dark:#c4bdb3/);
  assert.doesNotMatch(css, /#e0e5ec|#f0f0f3|#b8bcc2/);
});

test("keeps the survey reading surface free of a decorative halo", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Survey structure stays flat: no decorative halo around the reading surface/);
  assert.match(css, /\.survey-shell \.survey-intro,\s*\.survey-shell \.question-list,\s*\.survey-shell \.review-panel\{box-shadow:none!important\}/);
});

test("uses project red instead of blue or purple accents", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /--neu-accent:#c72d24/);
  assert.match(css, /--entry-accent:#c72d24/);
  assert.match(css, /--survey-blue:#c72d24!important/);
  assert.doesNotMatch(css, /#(?:6d5dfc|5d50df|4f46d8|315f83|174ba0|397da4|8fbbcc|91b6c8|8eb5c5)/i);
});

test("renders the project game title in red across public and workspace surfaces", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /The project title is consistently red wherever it identifies the game/);
  assert.match(css, /\.entryGate \.wordmark,\s*\.publicPage \.mark \.wordmark,\s*\.app \.brand \.wordmark,/);
  assert.match(css, /\.surveyHub>header>a,[\s\S]*\.survey-confirm>\.eyebrow\{color:#c72d24!important\}/);
});

test("keeps the concept callout in normal reading flow on mobile", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Public editorial asides stay in the document flow instead of inheriting the studio rail/);
  assert.match(css, /\.publicPage \.conceptRecruitment\{[\s\S]*position:static!important;[\s\S]*width:auto!important;[\s\S]*height:auto!important;[\s\S]*display:block!important/);
});

test("does not present participant identity as a non-working button", async () => {
  const studio = await readFile(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /<span className="avatar" aria-label=\{participantLabel\}>/);
  assert.doesNotMatch(studio, /<button className="avatar"/);
});

test("uses the current project name in public page metadata", async () => {
  const [concept, people] = await Promise.all([
    readFile(new URL("../app/concept/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/people/page.tsx", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(concept + people, /HOW 100 PEOPLE CALL A GAME/);
  assert.match(concept, /理念 — WHAT 100 PEOPLE DO TO A GAME/);
  assert.match(people, /共同创作者 — WHAT 100 PEOPLE DO TO A GAME/);
});

test("keeps public navigation labels intact on mobile", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Public navigation labels remain readable as single units on narrow screens/);
  assert.match(css, /\.publicPage \.top>nav a\{white-space:nowrap\}/);
});

test("uses purposeful motion with tactile feedback and a reduced-motion fallback", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Purposeful motion: movement confirms navigation, selection and completed actions/);
  assert.match(css, /@keyframes surfaceEnter/);
  assert.match(css, /@keyframes feedbackEnter/);
  assert.match(css, /@keyframes choiceConfirm/);
  assert.match(css, /\.survey-shell \.survey-progress i\{transition:width \.36s/);
  assert.match(css, /@media\(hover:hover\)/);
  assert.match(css, /transform:translateY\(1px\) scale\(\.99\)!important/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]*animation:none!important[\s\S]*transition:none!important;transform:none!important/);
});

test("consolidates overlapping survey prompts without losing earlier responses", async () => {
  const [questionSource, survey, lead] = await Promise.all([
    readFile(new URL("../app/survey/questions.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/survey/survey-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/lead/lead-dashboard.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(questionSource, /retiredQuestionIds=new Set\(\["recommendations","dislikedConcepts","viewpoint","mediaToGame","redLines","wantToGain"\]\)/);
  assert.match(questionSource, /你希望项目围绕怎样的 concept、主题或体验？又希望作品表达、追问或倡导什么？/);
  assert.match(questionSource, /哪些游戏类型、concept 或内容是你不想做、也不希望在作品中看到的？为什么？/);
  assert.match(questionSource, /你最想在项目里做什么，又希望从中获得什么？/);
  assert.match(survey, /function migrateDraftAnswers/);
  assert.match(survey, /mergeText\("avoidGenres",\["dislikedConcepts","redLines"\]\)/);
  assert.doesNotMatch(survey, /\["gameDefinition","likedGenres","recommendations"/);
  assert.match(lead, /import \{allQuestions\} from "\.\.\/survey\/questions"/);
  assert.match(lead, /allQuestions\.map/);
});

test("keeps the embedded survey title anchored above the scrolling questions", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Embedded survey navigation stays anchored while only the questionnaire moves/);
  assert.match(css, /\.worktop\{position:sticky!important;top:0;z-index:30\}/);
  assert.match(css, /\.workspace \.embeddedSurvey \.survey-head\{[\s\S]*position:sticky!important;[\s\S]*top:64px!important;[\s\S]*z-index:29!important/);
  assert.match(css, /@media\(max-width:600px\)\{[\s\S]*\.workspace \.embeddedSurvey \.survey-head\{position:sticky!important;top:54px!important/);
});

test("allows only the lead to delete explicitly identified questionnaire responses", async () => {
  const route = await readFile(new URL("../app/api/lead/responses/route.ts", import.meta.url), "utf8");
  assert.match(route, /export async function DELETE/);
  assert.match(route, /!isOwner\(req\)&&!await isLead\(req\)/);
  assert.match(route, /slice\(0,20\)/);
  assert.match(route, /SELECT id FROM questionnaire_responses WHERE id = \?/);
  assert.match(route, /DELETE FROM questionnaire_responses WHERE id = \?/);
  assert.match(route, /found\.length!==ids\.length/);
  assert.doesNotMatch(route, /DELETE FROM questionnaire_responses WHERE wechat_name/);
});

test("shows the original recruitment poster inside public access", async () => {
  const [concept, css] = await Promise.all([
    readFile(new URL("../app/concept/concept-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  await access(new URL("../public/project-recruitment-poster.jpg", import.meta.url));
  assert.match(concept, /className="projectPoster"/);
  assert.match(concept, /src="\/project-recruitment-poster\.jpg"/);
  assert.match(concept, /width="1024" height="1536" loading="lazy" decoding="async"/);
  assert.match(concept, /项目招募海报 · 2026/);
  assert.match(css, /The public concept page presents the original project poster as a primary artefact/);
  assert.match(css, /\.projectPoster\{width:min\(100%,760px\)/);
});

test("keeps the lead response drawer edge crisp and free of glow", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /Lead response drawer uses a crisp boundary without glow or fuzzy shadow/);
  assert.match(css, /\.profile-sheet\{[\s\S]*border-left:1px solid #9f988e!important;[\s\S]*border-radius:0!important;[\s\S]*box-shadow:none!important;[\s\S]*filter:none!important/);
  assert.match(css, /\.profile-backdrop\{-webkit-backdrop-filter:none!important;backdrop-filter:none!important\}/);
  assert.match(css, /Drawer motion communicates opening and closing without reintroducing glow/);
  assert.match(css, /@keyframes profileBackdropEnter/);
  assert.match(css, /@keyframes profileSheetEnter/);
  assert.match(css, /\.profile-sheet\{animation:profileSheetEnter \.28s/);
  assert.match(css, /\.profile-close:active\{background:#c72d24!important;color:#fff!important;transform:scale\(\.92\)!important\}/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{[\s\S]*\.profile-backdrop,\.profile-sheet\{animation:none!important\}/);
});

test("shows only the selected survey chapter as recessed and removes dead clicks", async () => {
  const [survey, css] = await Promise.all([
    readFile(new URL("../app/survey/survey-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
  ]);
  assert.match(survey, /const available=i<currentSection/);
  assert.match(survey, /disabled=\{!available\}/);
  assert.match(survey, /onClick=\{\(\)=>move\(i\)\}/);
  assert.doesNotMatch(survey, /onClick=\{\(\)=>i<currentSection&&move\(i\)\}/);
  assert.match(css, /Survey chapter rail: only the current chapter is recessed; every other chapter stays flat/);
  assert.match(css, /\.survey-shell \.section-progress\{[\s\S]*box-shadow:none!important;[\s\S]*overflow:hidden!important/);
  assert.match(css, /\.survey-shell \.section-progress button\.active:disabled\{[\s\S]*box-shadow:inset 5px 5px 10px/);
  assert.match(css, /\.survey-shell \.section-progress button:disabled\{[\s\S]*box-shadow:none!important/);
});

test("keeps same-route invitation navigation synchronized with browser history", async () => {
  const entry = await readFile(new URL("../app/entry-studio.tsx", import.meta.url), "utf8");
  assert.match(entry, /window\.addEventListener\("popstate",sync\)/);
  assert.match(entry, /window\.removeEventListener\("popstate",sync\)/);
  assert.match(entry, /function openInvite\(event:MouseEvent<HTMLAnchorElement>\)/);
  assert.match(entry, /history\.pushState\(\{\},"","\/\?access=invite"\)/);
  assert.match(entry, /href="\/\?access=invite" onClick=\{openInvite\}/);
  assert.match(entry, /href="\/" onClick=\{closeInvite\}/);
});

test("server-renders an authenticated workspace shell without a client identity waterfall", async () => {
  const [page, studio] = await Promise.all([
    readFile(new URL("../app/workspace/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(page, /participantId\(request\)/);
  assert.match(page, /<Studio initialParticipant=\{participant\} initialRole=\{role\} initialView=\{initialView\} initialResponses=\{initialResponses\}\/>/);
  assert.match(studio, /useState<View>\(initialView\)/);
  assert.match(studio, /role==="lead"\?loadLeadResponses\(\):loadSurvey\(\)/);
  assert.doesNotMatch(studio, /fetch\("\/api\/participant"/);
  assert.doesNotMatch(studio, /if\(!entered\)return <main className="workspaceBoot"/);
  assert.match(page, /role==="lead"&&initialView==="survey"/);
  assert.match(page, /FROM questionnaire_responses ORDER BY submitted_at DESC LIMIT 1000/);
  assert.match(studio, /<LeadResponses initialRows=\{initialResponses\}\/>/);
});

test("defers nonessential workspace requests until after the active view is ready", async () => {
  const studio = await readFile(new URL("../app/studio.tsx", import.meta.url), "utf8");
  assert.match(studio, /requestIdleCallback" in window/);
  assert.match(studio, /timeout:2200/);
  assert.match(studio, /window\.setTimeout\(load,1200\)/);
  assert.match(studio, /requestIdleCallback\(warm,\{timeout:3000\}\)/);
  assert.match(studio, /void loadLiveFlows\(\)/);
  assert.match(studio, /window\.setTimeout\(\(\)=>record\("view"\),1500\)/);
});

test("keeps aggregate site traffic visible only to the lead", async () => {
  const [layout, tracker, analytics, studio, schema, migration] = await Promise.all([
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/visit-tracker.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/analytics/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0020_private_site_traffic.sql", import.meta.url), "utf8"),
  ]);
  assert.match(layout, /<VisitTracker\/>/);
  assert.match(tracker, /sessionStorage\.getItem\(SESSION_KEY\)/);
  assert.match(tracker, /fetch\("\/api\/analytics",\{method:"POST",keepalive:true\}\)/);
  assert.match(analytics, /if\(!\(isOwner\(req\)\|\|await isLead\(req\)\)\)/);
  assert.match(analytics, /SUM\(visits\)/);
  assert.doesNotMatch(analytics, /user-agent|ip_address|display_code|participant_id/i);
  assert.match(studio, /仅主策划可见 · 北京时间/);
  assert.match(studio, /不保存访客姓名、IP 地址或设备信息/);
  assert.match(schema, /siteTrafficDaily=sqliteTable\("site_traffic_daily"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `site_traffic_daily`/);
});

test("keeps the creator contribution ranking private and awards completed tasks automatically", async () => {
  const [route, studio] = await Promise.all([
    readFile(new URL("../app/api/contributions/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/studio.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(route, /if \(!\(isOwner\(req\)\|\|await isLead\(req\)\)\)/);
  assert.match(route, /WITH completed_task_rows AS/);
  assert.match(route, /WHERE s\.status = 'submitted'/);
  assert.match(route, /SELECT f\.participant_id, f\.task_id/);
  assert.match(route, /COUNT\(DISTINCT task_id\) AS submitted_points/);
  assert.match(route, /FROM questionnaire_responses q/);
  assert.match(route, /AS task_points/);
  assert.match(route, /AS manual_points/);
  assert.match(route, /ORDER BY contribution_score DESC/);
  assert.match(studio, /创作者贡献排行榜/);
  assert.match(studio, /每项已完成任务自动计 1 分/);
  assert.match(studio, /手动调整贡献分/);
  assert.match(studio, /w100-contribution-ranking-/);
});
