import type {Metadata} from "next";
import {PeoplePage} from "./people-page";

export const metadata:Metadata={title:"People — HOW 100 PEOPLE CALL A GAME",description:"The people behind this participatory art project.",alternates:{canonical:"/people"},openGraph:{title:"People — HOW 100 PEOPLE CALL A GAME",description:"The people behind this participatory art project.",images:[]},twitter:{title:"People — HOW 100 PEOPLE CALL A GAME",description:"The people behind this participatory art project.",images:[]}};
export default function Page(){return <PeoplePage/>}
