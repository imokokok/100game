import type {Metadata} from "next";import {LeadDashboard} from "./lead-dashboard";
export const metadata:Metadata={title:"Lead Designer — WHAT 100 PEOPLE DO TO A GAME",robots:{index:false,follow:false}};
export default function LeadPage(){return <LeadDashboard/>}
