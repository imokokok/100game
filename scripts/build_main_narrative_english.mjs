import fs from "node:fs/promises";
import {SpreadsheetFile, Workbook} from "@oai/artifact-tool";

const output = new URL("../public/process/week1-main-narrative-en.xlsx", import.meta.url);
const workbook = Workbook.create();
const sheet = workbook.worksheets.add("Main Narrative");
sheet.showGridLines = false;
sheet.tabColor = "#E6543F";

sheet.getRange("A1:C2").values = [
  ["Main Narrative Structure", "", ""],
  ["English edition · 10 September 2026 · Written by 山梨之星", "", ""],
];
sheet.mergeCells("A1:C1");
sheet.mergeCells("A2:C2");

const rows = [
  ["1 · Arrival and rules",
   "A arrives by plane. The airport is busy and modern, with advertising that presents the town as a thriving media centre and promotes the residency application. A feels relaxed, curious and newly energised. She leaves by taxi and chats with the driver as they pass cafés, newspaper offices and media studios, establishing the scale and character of the town.\n\nFour-panel opening: the town seen from the plane; A looking up at the city buildings; two further images remain open for development.",
   "B arrives by ferry. The harbour foregrounds the town's southern-French atmosphere, distinctive architecture and close social warmth. B is excited, slightly nervous and ready to begin. She walks past the bus stop, metro, restaurant, record shop and tarot stall, recording opening hours, routes and rough NPC schedules in her notebook.\n\nFour-panel opening: the town seen from the ferry; B feeding pigeons on a park bench; two further images remain open for development."],
  ["2 · Entering the town",
   "A sets out and hears an intermittent sound that does not belong to the town's ordinary rhythm. Curious, she follows it. On the way, the smell from a local shop draws her towards the door, but a resident drops books and paper bags across the pavement. A helps gather them and hears a few pieces of local gossip before accompanying the resident towards home. A large film studio stands beside the housing block, carrying the town's cultural history and the marks of its media industry.",
   "B begins with a route planned in her notebook and heads for breakfast. The notes point to a restaurant beside an abandoned post box under an old wall. The post box is still there, but uncontrolled shrubs have overgrown the entrance, forcing her to find another way in. The menu has no pictures and uses local phrases and dialect names. The unfamiliar food leaves her visibly uncertain. After eating, she finds a small guardian statue in the grass beside the restaurant, an object carrying traces of another period."],
  ["3 · Relationships and calculation",
   "Away from her old social circle, A discovers how hard it is to be trusted when nobody knows her. She stands in a lively crowd without recognising a single person. Later she sees the resident she helped laughing with the taxi driver and learns that they are neighbours. Apparently separate people are joined by fine lines of kinship, old acquaintance and chance contact. Together they form a dense local network.",
   "B notices the town's unusual prices: some everyday goods cost less than in the city, while a few scarce items are unexpectedly expensive. During her shopping, a public loudspeaker suddenly interrupts the day with a brief, indistinct notice. It has no fixed schedule, and locals barely react. The market also has no official opening time; people rely on word of mouth. B happens to find it open and buys a necklace."],
  ["4 · Recognition begins to stall",
   "As A meets more people, discussion about her begins moving through the town. Some residents describe her as open and friendly; others suspect she is flattering people to secure residency. She overhears the comments without confronting anyone. At the produce market, someone kindly warns her that newcomers who appear too close to locals quickly become a subject of speculation, and hints that recognition cannot be earned simply by approaching everyone directly. A stays calm but begins to examine how her goodwill is being interpreted.",
   "B follows her planned route and becomes lost among branching woodland paths. Navigation fails, signboards are faded or covered with posters, and local landmarks such as the old locust tree and the former post box do not appear on the map. Although local information travels quickly, several residents stop to help. They introduce her to a residents-only website, where she reads more about the town and finds posts documenting the plants growing around the restaurant she visited earlier."],
  ["5 · Accident and cost",
   "A uses her phone to answer friends and family. She neither makes the situation sound better than it is nor hides what has been difficult. The future remains uncertain, but her messages are steady and honest rather than defeated.",
   "After getting lost, B decides to research the website before planning again. She learns that the necklace is based on the old locust tree destroyed by a storm, the same unmarked tree locals use as a landmark, and discovers the story behind it. At dusk she watches market traders exchange unsold fruit and vegetables without money. Someone gives her a few ingredients. Back at her lodging, she cooks with them and recognises that, despite the uncertainty ahead, she is already living inside the town's everyday life."],
  ["6 · The final complete stretch",
   "A reads the official residency material and remembers a film studio that feels increasingly familiar. She suddenly recognises it from a proposal she once developed. Following that professional instinct through the town, she finds a discreet building carved with the old locust tree. It has none of the media centre's lights or publicity, yet serves as the industry's real production archive: proposals, shoots, staff allocations, abandoned projects, undelivered material and incident reports, including everything the town does not show in public.",
   "B reviews previous unsuccessful residency applications and discovers that one applicant was a university classmate. They once shared ambitions in the media industry, supported one another and worked on a senior colleague's project, but their ability was suppressed because they lacked status and experience. B imagines a future in the town: restarting an abandoned proposal, making work from the lives of residents and newcomers, and building a platform where outside creators can collaborate with local practitioners. The vision is vivid, but the residency result remains unresolved."],
  ["7 · The final evening",
   "The public loudspeaker announces that residency results will be released the following morning. Locals barely react, while many applicants stop in the street. A feels expectation and unease arrive together. She later encounters a production team interviewing applicants at the film studio and watches creators of different ages help one another without calculating personal gain. At night on the balcony, she opens a message to her family and finally sends only: 'The result comes tomorrow.' Moonlight covers the terrace while the town glows below.",
   "B revisits places she has crossed throughout the week. The landscape has changed slightly: shrubs have thickened beside smaller paths, new posters cover old signs, unfamiliar flowers have appeared at the edge of the market, and the plants around the old post box no longer hold the same shape. That night she returns to the harbour from her first day and sits facing the sea. Moonlight and dock lights break across the moving water in small blue fragments."],
];

sheet.getRange("A4:C4").values = [["Narrative phase", "A route", "B route"]];
sheet.getRange("A5:C11").values = rows;
sheet.getRange("A13:C13").values = [["Four-panel interaction rule", "", ""]];
sheet.mergeCells("A13:C13");
sheet.getRange("A14:C14").values = [["Upper left · the town as the protagonist sees it: places and events shown with relative objectivity. Upper right · the protagonist as residents see her: the emotions, expression and attitude she presents to others. Lower left · subconscious: passing worries, fixations and private thoughts. Lower right · background: fragments of earlier life, childhood memory and unresolved concerns, unlocked as the story develops. Players can open any panel for short internal lines, memories, hidden jokes, dialogue or side routes. At selected moments, panels may split or crack apart so a detail can be enlarged and inspected.", "", ""]];
sheet.mergeCells("A14:C14");

sheet.getRange("A1:C14").format.font = {name:"Arial", size:10, color:"#111210"};
sheet.getRange("A1:C1").format.font = {name:"Arial", size:16, bold:true, color:"#111210"};
sheet.getRange("A2:C2").format.font = {name:"Arial", size:10, italic:true, color:"#686A66"};
sheet.getRange("A4:C4").format = {fill:"#111210", font:{name:"Arial",size:10,bold:true,color:"#FFFFFF"}, horizontalAlignment:"center", verticalAlignment:"center"};
sheet.getRange("A5:A11").format = {fill:"#F0EDE5", font:{name:"Arial",size:10,bold:true,color:"#111210"}, verticalAlignment:"top", wrapText:true};
sheet.getRange("B5:C11").format = {font:{name:"Arial",size:10,color:"#111210"}, verticalAlignment:"top", wrapText:true};
sheet.getRange("A5:C11").format.borders = {insideHorizontal:{style:"thin",color:"#D7D5CF"}, bottom:{style:"thin",color:"#D7D5CF"}};
sheet.getRange("A13:C13").format = {fill:"#E6543F", font:{name:"Arial",size:11,bold:true,color:"#FFFFFF"}, verticalAlignment:"center"};
sheet.getRange("A14:C14").format = {fill:"#F8F7F2", font:{name:"Arial",size:10,color:"#111210"}, verticalAlignment:"top", wrapText:true, borders:{preset:"outside",style:"thin",color:"#D7D5CF"}};
sheet.getRange("A1:A14").format.columnWidth = 22;
sheet.getRange("B1:C14").format.columnWidth = 64;
sheet.getRange("1:1").format.rowHeight = 24;
sheet.getRange("2:2").format.rowHeight = 18;
sheet.getRange("4:4").format.rowHeight = 24;
sheet.getRange("5:11").format.rowHeight = 148;
sheet.getRange("13:13").format.rowHeight = 24;
sheet.getRange("14:14").format.rowHeight = 88;
sheet.freezePanes.freezeRows(4);

workbook.recalculate();
const inspect = await workbook.inspect({kind:"table", range:"Main Narrative!A1:C14", include:"values,formulas", tableMaxRows:14, tableMaxCols:3, maxChars:8000});
console.log(inspect.ndjson);
const errors = await workbook.inspect({kind:"match", searchTerm:"#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!", options:{useRegex:true,maxResults:100}, summary:"final formula error scan"});
console.log(errors.ndjson);
const preview = await workbook.render({sheetName:"Main Narrative", range:"A1:C14", scale:1, format:"png"});
await fs.writeFile(new URL("../.tmp-review/main-narrative-en.png", import.meta.url), new Uint8Array(await preview.arrayBuffer()));
const file = await SpreadsheetFile.exportXlsx(workbook);
await file.save(output.pathname.replace(/^\//, ""));
