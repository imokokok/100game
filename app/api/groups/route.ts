import { NextRequest,NextResponse } from "next/server";
export async function POST(req:NextRequest){const role=req.headers.get("x-project-role");if(role!=="owner")return NextResponse.json({error:"Only the Owner can create groups"},{status:403});return NextResponse.json({id:crypto.randomUUID(),...(await req.json())},{status:201})}
export async function GET(req:NextRequest){const participant=req.cookies.get("participant")?.value;if(!participant)return NextResponse.json({error:"Invitation required"},{status:401});return NextResponse.json({groups:[]})}
