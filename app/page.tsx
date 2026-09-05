import { EntryStudio } from "./entry-studio";
import {redirect} from "next/navigation";

export const dynamic = "force-dynamic";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const params = await searchParams;
  const access = Array.isArray(params.access) ? params.access[0] : params.access;
  const hasInvite = Object.prototype.hasOwnProperty.call(params, "invite");
  const inviteCode = Array.isArray(params.invite) ? params.invite[0] : params.invite;
  if(access==="lead")redirect("/lead");
  const requested=Array.isArray(params.view)?params.view[0]:params.view;
  const initialPublicView=requested==="process"||requested==="projects"?requested:"concept";
  return (
    <EntryStudio
      initialInvite={access === "invite" || hasInvite}
      initialCode={inviteCode ?? ""}
      initialPublicView={initialPublicView}
    />
  );
}
