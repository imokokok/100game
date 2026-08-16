import type {Metadata} from "next";
import {PeoplePage} from "./people-page";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata:Metadata={title:"People — WHAT 100 PEOPLE DO TO A GAME",description:"The people behind this participatory art project.",alternates:{canonical:"/people"},openGraph:{title:"People — WHAT 100 PEOPLE DO TO A GAME",description:"The people behind this participatory art project.",images:[]},twitter:{title:"People — WHAT 100 PEOPLE DO TO A GAME",description:"The people behind this participatory art project.",images:[]}};
export default function Page(){return <PeoplePage/>}
