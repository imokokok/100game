import {editorialAssets,editorialContent,type EditorialLang} from "./content";
import type {CSSProperties} from "react";

type Copy=(typeof editorialContent)[EditorialLang];

function Lines({text}:{text:string}){
 return <>{text.split("\n").map((line,index)=><span key={`${line}-${index}`}>{line}</span>)}</>;
}

function SectionNumber({number}:{number:string}){
 return <span className="editorialSectionNumber" aria-label={`Section ${number}`}>{number}<i aria-hidden="true"> / 08</i></span>;
}

function Eyebrow({children}:{children:string}){
 return <p className="editorialEyebrow">{children}</p>;
}

export function ProjectMark(){
 return <span className="editorialProjectMark" aria-hidden="true"><strong>100</strong><span>PEOPLE</span></span>;
}

export function HeroSection({copy}:{copy:Copy["hero"]}){
 return <section className="editorialSection editorialHero" id="section-01" aria-labelledby="editorialHeroTitle">
  <SectionNumber number="01"/>
  <div className="editorialHeroCopy" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h1 id="editorialHeroTitle" aria-label={copy.titleLabel}>
    <span>{copy.lineOne}</span>
    <span><em>{copy.lineTwoPrefix}</em> {copy.lineTwoSuffix}</span>
    <span>{copy.lineThreePrefix} <em>{copy.lineThreeAccent}</em></span>
   </h1>
   <p className="editorialHeroSubtitle">{copy.subtitle}</p>
   <p className="editorialHeroNote">{copy.note}</p>
   <a className="editorialScroll" href="#section-02"><span aria-hidden="true">↓</span>{copy.scroll}</a>
  </div>
  <div className="editorialHeroStage" data-reveal="visual" aria-hidden="true">
   <div className="heroDoorPlane heroDoorPlaneBack"/>
   <div className="heroDoorPlane heroDoorPlaneFront"/>
   <div className="heroDoorRedEdge"/>
   <div className="heroDoorThreshold"/>
   <div className="editorialFigure"><i/></div>
  </div>
 </section>;
}

export function QuestionSection({copy}:{copy:Copy["question"]}){
 return <section className="editorialSection editorialQuestion" id="section-02" aria-labelledby="questionTitle">
  <SectionNumber number="02"/>
  <div className="editorialQuestionHeading" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="questionTitle"><Lines text={copy.title}/></h2>
  </div>
  <div className="questionVisual" data-reveal="visual" aria-hidden="true">
   <div className="questionDoor questionDoorLeft"/>
   <div className="questionDoor questionDoorRight"/>
   <div className="questionOrb"><i/><b/></div>
   <div className="questionGround"/>
   <div className="editorialFigure questionFigure"><i/></div>
  </div>
  <div className="editorialQuestionBody" data-reveal="copy">
   <div className="questionStatements">{copy.statements.map(item=><span key={item}>{item}</span>)}</div>
   <div className="editorialBodyCopy">{copy.body.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>
  </div>
  <div className="questionMargin" aria-hidden="true">{copy.margin.map(item=><span key={item}>{item}</span>)}</div>
 </section>;
}

export function Why100Section({copy}:{copy:Copy["why"]}){
 const people=Array.from({length:28},(_,index)=>index);
 return <section className="editorialSection editorialWhy" id="section-03" aria-labelledby="whyTitle">
  <SectionNumber number="03"/>
  <div className="editorialWhyHeading" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="whyTitle"><Lines text={copy.title}/></h2>
  </div>
  <div className="whyVisual" data-reveal="visual" aria-hidden="true">
   <div className="whyRedCircle"/>
   <div className="whyPeopleField">{people.map(index=><i key={index} style={{"--person-index":index} as CSSProperties}/>)}</div>
   <div className="whyGround"/>
   <div className="editorialFigure whyFigure"><i/></div>
  </div>
  <div className="editorialWhyBody" data-reveal="copy">
   <p>{copy.body}</p>
   <div className="whyCounts">{copy.counts.map(item=><span key={item}>{item}</span>)}</div>
  </div>
 </section>;
}

export function ProcessSection({copy}:{copy:Copy["process"]}){
 return <section className="editorialSection editorialProcess" id="section-04" aria-labelledby="processTitle">
  <SectionNumber number="04"/>
  <div className="processIntro" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="processTitle"><Lines text={copy.title}/></h2>
  </div>
  <ol className="processSteps" data-reveal="copy">
   {copy.steps.map(step=><li key={step.number}><span>{step.number}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}
  </ol>
  <div className="processRail" aria-hidden="true">{copy.steps.map((step,index)=><span key={step.number} className={index===3?"isAccent":""}><i/>{step.number}</span>)}</div>
  <p className="processAside" aria-hidden="true"><Lines text={copy.aside}/></p>
 </section>;
}

export function WorldSection({copy}:{copy:Copy["world"]}){
 return <section className="editorialSection editorialWorld" id="section-05" aria-labelledby="worldTitle">
  <SectionNumber number="05"/>
  <div className="worldCopy" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="worldTitle"><Lines text={copy.title}/></h2>
  </div>
  <div className="worldVisual" data-reveal="visual" aria-hidden="true">
   <div className="worldDoor worldDoorDark"/>
   <div className="worldDoor worldDoorPaper"/>
   <div className="worldRedSun"/>
   <div className="worldGround"/>
  </div>
 </section>;
}

export function PeopleSection({copy}:{copy:Copy["people"]}){
 return <section className="editorialSection editorialPeople" id="section-06" aria-labelledby="peopleTitle">
  <SectionNumber number="06"/>
  <div className="peopleHeading" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="peopleTitle"><Lines text={copy.title}/></h2>
  </div>
  <figure className="peopleCollage" data-reveal="visual">
   <img src={editorialAssets.people.src} width={editorialAssets.people.width} height={editorialAssets.people.height} loading="eager" fetchPriority="low" decoding="async" alt={copy.imageAlt}/>
  </figure>
  <div className="peopleBody editorialBodyCopy" data-reveal="copy">{copy.body.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>
 </section>;
}

export function InspirationSection({copy}:{copy:Copy["inspiration"]}){
 return <section className="editorialSection editorialInspiration" id="section-07" aria-labelledby="inspirationTitle">
  <SectionNumber number="07"/>
  <div className="inspirationHeading" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="inspirationTitle"><Lines text={copy.title}/></h2>
  </div>
  <div className="inspirationVisual" data-reveal="visual" aria-hidden="true">
   <div className="inspirationCross"><i/><b/></div>
   <div className="inspirationPlane inspirationPlaneBack"/>
   <div className="inspirationPlane inspirationPlaneFront"/>
   <div className="editorialFigure inspirationFigure"><i/></div>
  </div>
  <div className="inspirationBody editorialBodyCopy" data-reveal="copy">{copy.body.map(paragraph=><p key={paragraph}>{paragraph}</p>)}</div>
 </section>;
}

export function ClosingSection({copy}:{copy:Copy["closing"]}){
 return <section className="editorialSection editorialClosing" id="section-08" aria-labelledby="closingTitle">
  <SectionNumber number="08"/>
  <div className="closingHeading" data-reveal="title">
   <Eyebrow>{copy.eyebrow}</Eyebrow>
   <h2 id="closingTitle"><Lines text={copy.title}/></h2>
  </div>
  <div className="closingVisual" data-reveal="visual" aria-hidden="true">
   <div className="closingArch"><i/></div>
   <div className="closingRedDoor"/>
   <div className="closingPath"/>
  </div>
  <p className="closingBody" data-reveal="copy">{copy.body}</p>
  <p className="closingAside" aria-hidden="true"><Lines text={copy.aside}/></p>
 </section>;
}
