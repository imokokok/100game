from pathlib import Path
from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Inches, Pt, RGBColor

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "process"

def shade(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd"); tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)

def borders(cell):
    tc_pr = cell._tc.get_or_add_tcPr(); edges = OxmlElement("w:tcBorders")
    for name in ("top", "left", "bottom", "right", "insideH", "insideV"):
        edge = OxmlElement(f"w:{name}"); edge.set(qn("w:val"), "single"); edge.set(qn("w:sz"), "4"); edge.set(qn("w:color"), "D9D9D9"); edges.append(edge)
    tc_pr.append(edges)

def build(filename, title, subtitle, intro, sections, tables=()):
    doc = Document(); section = doc.sections[0]
    section.page_width, section.page_height = Inches(8.5), Inches(11)
    section.top_margin = section.bottom_margin = Inches(.8); section.left_margin = section.right_margin = Inches(.9)
    styles = doc.styles
    for role, size, bold, before, after in [("Normal", 11, False, 0, 7), ("Title", 28, True, 0, 12), ("Subtitle", 12, False, 0, 22), ("Heading 1", 18, True, 20, 8), ("Heading 2", 13, True, 14, 5)]:
        style = styles[role]; style.font.name = "Aptos"; style.font.size = Pt(size); style.font.bold = bold; style.font.color.rgb = RGBColor(0,0,0)
        style.paragraph_format.space_before = Pt(before); style.paragraph_format.space_after = Pt(after); style.paragraph_format.line_spacing = 1.16
    p = doc.add_paragraph(title, style="Title"); p.alignment = WD_ALIGN_PARAGRAPH.LEFT
    doc.add_paragraph(subtitle, style="Subtitle")
    doc.add_paragraph(intro)
    for heading, body in sections:
        doc.add_paragraph(heading, style="Heading 1")
        for paragraph in body:
            doc.add_paragraph(paragraph)
    for heading, headers, rows, widths in tables:
        doc.add_paragraph(heading, style="Heading 1")
        table = doc.add_table(rows=1, cols=len(headers)); table.autofit = False
        for i, text in enumerate(headers):
            cell = table.rows[0].cells[i]; cell.text = text; cell.width = Inches(widths[i]); shade(cell, "2D3748"); borders(cell); cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            for run in cell.paragraphs[0].runs: run.font.bold = True; run.font.color.rgb = RGBColor(255,255,255); run.font.size = Pt(9)
        for r_index, row in enumerate(rows):
            cells = table.add_row().cells
            for i, text in enumerate(row):
                cells[i].text = text; cells[i].width = Inches(widths[i]); cells[i].vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER; borders(cells[i])
                if r_index % 2: shade(cells[i], "F3F5F7")
                for p in cells[i].paragraphs:
                    p.paragraph_format.space_after = Pt(3); p.paragraph_format.space_before = Pt(3)
                    for run in p.runs: run.font.size = Pt(9)
    doc.core_properties.title = title; doc.core_properties.subject = subtitle; doc.core_properties.author = "HuieChen 陈慧娥"
    doc.save(OUT / filename)

build(
 "week1-digital-proposal-en.docx", "HOW 100 PEOPLE CALL A GAME Digital Proposal", "Professional English Edition", 
 "This proposal defines the project's first complete design direction: a single-player experience with two protagonists, a seven-day residency application, one hundred residents with independent routines, and a town shaped by time, money, information and relationships. The early experience should feel light, playful and slightly absurd; its emotional weight should emerge from choices the player has already made rather than from explanatory dialogue.",
 [
  ("Core Concept", ["The game asks how we understand lives unlike our own. Every person acts on limited information, and the same event can carry different causes, meanings and costs in different lives. A and B begin from a similar emotional point but grow within different family, educational, financial and social conditions. The player experiences the same seven days through both perspectives, with access to different amounts of time, money, information and support.", "Time is the central resource. Four free hours may form one uninterrupted afternoon or several fragments of twenty, forty and fifty minutes. The total is identical, but the possibilities are not. Money, relationships and information all change how time can be used. The intended conclusion is concrete rather than didactic: our own perspective is limited, and other people need room to remain complex."]),
  ("Story World", ["A and B arrive in a fictional town to apply for permanent residency. They have seven days to complete preliminary requirements before a formal review. The process combines basic paperwork, evidence of local participation and recognition from at least twelve permanent residents. Recognition is not a popularity score: a resident may know the applicant well, know them through repeated encounters, or refuse to confirm the relationship.", "The town's one hundred NPCs continue living according to schedules derived from participant questionnaires. They study, work, walk dogs, play sport, sleep, read, rest and meet one another whether or not the player is present. Finding someone therefore requires entering their available time. Residents can introduce the player to other people, but every new relationship must still be developed."]),
  ("Two Playable Characters", ["A acts first and reflects afterwards. She is open to unfamiliar places, people and spontaneous invitations, so her route grows through encounters, last-minute decisions and chains of relationships. Her stronger financial position allows her to buy speed and convenience, although she still has to ask for help when money is not enough.", "B plans before acting. She studies locations, prices, opening hours, transport and existing commitments before choosing a route. Her notebook stores plans, payments, NPC availability, transport options, confirmed relationships and small observations. She tends to rely on time and social connections before spending money. The two characters retain meaningful choice, but their starting conditions make identical decisions carry different costs."]),
  ("Core Systems", ["The time system determines what can fit into a day and whether both parties are available. Long activities require continuous blocks, while short tasks can use fragments. The money system affects transport, urgent tasks, materials and the ability to exchange cost for certainty. Relationships can create introductions, shared journeys, discounts and alternative routes. Information saves time by revealing opening hours, quicker paths and NPC routines.", "NPC availability is not a menu convenience. Each resident has a routine, and the interface only reveals information the player has actually learned. A remembers patterns through lived encounters; B records confirmed information in her notebook. The completed game requires a full schedule and relationship map for all one hundred residents."]),
  ("Major Activities", ["The restaurant combines cooking and management. Players prepare food through direct actions, develop a public recipe book, and can earn a share of revenue. The writing and collage-poetry activity lets players rearrange, revise or create text for residents, then exhibit their own work. Card reasoning and tarot turn incomplete information into questions about interpretation rather than simple prediction.", "Other activities include resolving misunderstandings through dialogue and visual clues; three-dimensional optical-illusion spaces connected to memory; field recording, arrangement and music-video production; board games; and quiet moments of observation. Each activity must connect to time, money, relationships or information rather than exist as an isolated minigame."]),
  ("Cross Media and Co Creation", ["Worktables use physical-looking materials such as paper, photographs, notes, recordings and collage. Player-made recipes, poems, recordings and images become part of a personal archive. The project can also invite participants to contribute dialogue, drawings, handwriting, schedules and small interactions, allowing the final work to retain visible traces of collective authorship."]),
  ("Confirmed Scope and Open Work", ["The core concept, two-character logic, residency framework, major resource systems, contrasting play styles, questionnaire-based NPC routines, primary activity groups, income loops, cross-media worktables and transitional narrative direction are confirmed. The next design phase must resolve the protagonists' full backstories, chapter events, numerical balance, the complete NPC network, detailed dialogue, interface pages, level scripts and technical specifications."]),
 ],
 [("Representative NPC Routines", ["NPC", "Confirmed routine", "Common places or activities"], [
  ("Mossner", "06:00 wake, 21:00 sleep", "Library, theatre, coffee, script development"), ("Sunniva", "09:00–10:00 wake on days off", "Library, shopping centre, craft shop, sightseeing"), ("Zhou Xiaoliu", "07:45 wake, 00:00–01:00 sleep", "Classroom, canteen, sports ground, food street"), ("Abyssia", "10:00 wake, 01:00 sleep, volleyball at 19:50", "Dormitory, volleyball court"), ("Xia Touming", "07:00–08:00 wake, 23:00–23:30 sleep", "Cafe, park, walking"), ("Jiu", "09:00 wake, 24:00 sleep, library at 18:00", "Bookshop, drinks shop, library")
 ], [1.25,2.5,2.6])]
)

build(
 "week2-development-update-week3-plan-en.docx", "SOLMERE Week 2 Development Update and Week 3 Plan", "Professional English Edition", 
 "Week 2 moved Solmere from an overall concept towards a playable production structure. The ETC has been established, the backgrounds and motivations of A and B have been expanded, twelve major NPCs have been selected from the wider town cast, several core minigames now have working MVPs, and art and sound production are underway. The focus is shifting from whether individual activities work to why the player travels, meets a character and follows one action into the next.",
 [
  ("Main Archive System", ["During seven days in Solmere, the player compiles and submits a personal archive. It can combine typed and handwritten text, drawings, photographs, receipts, notes and other traces of everyday life. Places visited, people met and objects retained all become material, so every final archive reflects a different route through the town. This system connects the town's creative culture to the main objective and gives exploration a persistent purpose."]),
  ("A and B", ["A works in art and creative practice and is seeking musical collaborators for an active project. Solmere attracts her through its open creative environment and access to studios and musicians. B has a more ordinary financial background, loves music, and is closer to production or post-production work. Solmere offers both employment and a way to remain near the music world. The next phase will strengthen how time, money and networks distinguish their strategies while preserving player choice."]),
  ("Twelve Major NPCs", ["The team completed a relationship chart and selected twelve residents for deeper stories. Introductions, favours and shared information will form a chain of motivations: one resident mentions another, a commission reveals a new location, and that location opens a further opportunity. Social connections should become a practical resource rather than decorative dialogue."]),
  ("Minigames and Interaction", ["The restaurant MVP now covers ordering, cooking and service, with ingredient stock, changing menus, hand-drawn recipes and revenue. Music sampling connects field recording, a personal sound library, arrangement, sound drawing, record production and sales. Collage poetry links letters, commissioned writing, exhibition and personal expression. Tarot, the panoramic-map activity, the observatory, dialogue and misunderstanding-resolution systems continue to be integrated into the town rather than treated as standalone scenes."]),
  ("Economy and Memory Spaces", ["Income comes from restaurant work, writing and creative production. Spending can buy speed, access or materials, while relationships create alternative routes. A and B also receive distinct three-dimensional memory spaces that reveal background and perspective without replacing the playable town."]),
  ("Production Status", ["Art assignments are distributed and temporary assets are being replaced. UI work is aligning the archive, notebook and activity flows. A first group of sound effects has been added, while original music remains a priority. Current builds are suitable for recording short progress demonstrations, although interaction polish and content connections are still in progress."]),
  ("Week 3 Priorities", ["Week 3 will consolidate the main loop, strengthen the route from locations to NPCs and activities, refine the resource economy, continue art replacement and audio production, and turn the existing MVPs into a coherent playable sequence. The priority is not adding unrelated features, but ensuring that each system creates a clear reason for the next action."]),
 ]
)

build(
 "week3-architecture-adjustment-en.docx", "SOLMERE Architecture Revision", "Professional English Edition", 
 "This revision responds to a project that had accumulated enough strong material but lacked a clear relationship between its parts. The seven-day structure is reduced to five days, the four principal minigames remain, tarot and the observatory stay available for free exploration, and the dual-protagonist structure becomes the organising core. Existing maps and most art assets remain usable.",
 [
  ("Returning to the Two Flowers Structure", ["A and B have almost identical faces but different clothing, habits and ways of living. During the first four days, the player follows only one protagonist at a time and naturally assumes that the same woman is being controlled throughout. Both women are in Solmere simultaneously; the viewpoint is alternating between two lives. A begins to confirm the other's existence on Day 3, B does so on Day 4, and they finally meet on Day 5."]),
  ("Shared Home and Early Crossovers", ["A and B occupy separate rooms or floors in the same temporary residence. Entrances, stairs, doors and the mailbox form a small shared boundary, while their routines keep them apart. Residency documents, work notices, letters and ordinary post occasionally cross paths. At first these incidents appear to be minor mistakes. Repeated overlaps in places, times, creative work and relationships gradually reveal that another life is present."]),
  ("Character Foundations", ["A wants to become a creative director. She generates ideas quickly across many media and readily begins new experiments. Her challenge is not a lack of ambition but the difficulty of choosing one compelling direction and carrying it through. Her schedule therefore contains flexible fragments and frequent opportunities to rearrange them.", "B's ambition is directly connected to music. She has artistic sensitivity and has created music or sound privately, but prioritises a stable life before taking greater risks. Fixed work gives her income and structure. Her challenge is recognising which opportunities truly require more preparation and which are already within reach."]),
  ("Difference as Play", ["The two characters should not be reduced to rich versus poor or spontaneous versus cautious. Their different resources, obligations and tolerances shape how they use time, money and relationships. A must turn scattered possibilities into sustained direction. B must decide when stability protects her and when it becomes a reason to keep waiting."]),
  ("Four Principal Activities", ["Chess and other structured games suit A's need to commit attention and read another person's decisions. Restaurant work places her creativity inside service, repetition and responsibility. Music creation gives B a direct route towards a field she has kept at a distance. Collage poetry lets her compose from fragments, memory and borrowed language. Each activity advances character as well as production mechanics."]),
  ("Day Five Exchange", ["On Day 5, A and B enter parts of one another's established lives. The exchange is not a complete role reversal. It allows each to encounter an access point, constraint or relationship that had previously belonged to the other. Their meeting reveals the double structure and reinterprets earlier discontinuities without erasing the reality of either life."]),
  ("Philosophy Ending and Experience Goal", ["The project is about how people construct a coherent explanation from partial evidence, and how quickly that explanation can become a judgement. Its ending should remain open enough for players to consider similarity, difference, privilege, preparation and choice without receiving a single moral answer. The intended experience is recognition: the world did not suddenly change on Day 5; the player's understanding of it did."]),
  ("Next Work", ["The next phase must finalise the five-day event sequence, define both protagonists' fixed and flexible schedules, map NPC knowledge across the two routes, specify Day 5 exchanges, revise transitional writing and confirm which existing assets require adaptation."]),
 ],
 [("Current Five Day Structure", ["Day", "Viewpoint", "Primary activity", "Narrative function"], [
  ("Day 1", "A", "Music creation", "Establish the player's first impression of the protagonist"), ("Day 2", "B", "Restaurant", "Introduce slight discontinuity"), ("Day 3", "A", "Collage poetry and letters", "A confirms another person's existence and begins to search"), ("Day 4", "B", "Chess", "B confirms the other person and attempts contact"), ("Day 5", "A and B", "Enter each other's established life", "They meet; the dual identity is revealed; each experiences the other's access and routines")
 ], [.75,1.05,1.8,3.0])]
)

build(
 "week3-core-mechanics-system-design-en.docx", "SOLMERE Core Mechanics and Systems Design", "Professional English Edition", 
 "The core game is now defined as schedule management driven by three connected systems: character state, time and money. Each day begins with fixed commitments and known information in the Notebook. The player allocates the remaining time, enters the town and carries out the plan while NPC schedules, opening hours and temporary events continue to move. Every action changes time, money and character state, and its consequences carry into later actions and the following day.",
 [
  ("Character State", ["Four dimensions describe the character's physical condition, engagement with the world, cognitive clarity and sense of material security. Each has a stable operating range rather than a simple goal of maximum value. Work, creativity, rest, spending, social activity and fulfilled plans shift the balance. Sustained extremes create Conditions with practical consequences.", "State is not displayed as four permanent bars during exploration. The Notebook describes it through readable levels such as energised, steady or tired; engaged, fluctuating or burnt out; clear, scattered or confused; secure, unsettled or anxious. Tiredness slows walking, confusion disrupts the Notebook, burnout changes initial reactions to unfamiliar opportunities, and insecurity makes expensive or risky decisions feel more consequential."]),
  ("Time", ["Activities specify duration and availability. Continuous activities require an uninterrupted block; short activities fit into fragments; fixed-time events open only within a narrow window; open-time activities are available across broader hours; and sequential activities require an earlier step. Travel also consumes time, while NPCs and shops follow their own schedules.", "A has more total flexibility but many small gaps. She can reorganise her day often, although repeated changes reduce clarity. Her strategy is to combine fragments into useful time without letting constant revision create disorder. B has larger uninterrupted blocks but fixed restaurant shifts. She can take leave, finish early or exchange shifts, each with financial, relational or scheduling consequences."]),
  ("Money", ["Money purchases speed, services, materials and certainty. A can more readily use spending to protect time, but costly shortcuts cannot solve every social or creative problem. B relies more on income, preparation and relationships; a favour or shared journey may replace a direct payment but requires earlier investment in people. Low security makes high-cost purchases and missed work feel increasingly risky."]),
  ("The Closed Loop", ["Planning changes state and determines which opportunities fit. Executing the plan consumes time and money, changes relationships and reveals information. These results alter the Notebook and the next day's possibilities. The loop keeps minigames, NPC events and exploration connected to the same decision system rather than allowing them to function as separate attractions."]),
  ("Collecting the Character Mosaic", ["Knowledge about residents is collected through repeated encounters, introductions, letters, objects, observations and the consequences of shared activities. The player does not unlock a complete biography at once. Fragments remain attached to their sources, allowing uncertainty and contradiction to persist until the player has enough context to revise an earlier interpretation."]),
  ("Daily Player Flow", ["Read the Notebook and fixed commitments; review state, money and known opportunities; arrange activities on the timeline; enter the town and travel; respond to changing availability and temporary events; complete work, creative activities and NPC encounters; record new information and material in the archive; then close the day and carry its effects forward."]),
 ],
 [("State System", ["Dimension", "Range", "Primary inputs", "Effect when unbalanced"], [
  ("Body", "Tired ↔ Energised", "Sleep, walking, work, long activities, meals", "Walking and long activities take more effort; severe fatigue carries into the next day"), ("Engagement", "Burnt out ↔ Engaged", "Enjoyable activity, creativity, social contact, prolonged work", "More cautious first reactions to unfamiliar exploration and creative opportunities"), ("Clarity", "Confused ↔ Clear", "Task switching, replanning, information load, rest", "Notebook revisions and repeated reminders; subtle information becomes harder to notice"), ("Security", "Anxious ↔ Secure", "Disposable money, stable income, commitments, future plans", "Stronger internal warnings around spending, leave and further schedule changes")
 ], [1.0,1.1,2.0,2.5]),
 ("Activity Time Rules", ["Type", "Rule", "Examples"], [
  ("Continuous", "Requires one uninterrupted block", "Music creation, longer minigames, deep NPC events"), ("Short", "Fits into small gaps", "Collecting mail, brief dialogue, observation, side tasks"), ("Fixed time", "Available only within a defined window", "Chess appointments, work, selected NPC events"), ("Open time", "Available across broader opening hours", "Tarot, shops, free exploration"), ("Sequential", "Unlocks after a prior step", "Writing then posting a letter, multi-stage character events")
 ], [1.2,2.3,3.1])]
)

print("Built four English process documents")
