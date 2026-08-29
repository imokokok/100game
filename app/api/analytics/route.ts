import {NextRequest,NextResponse} from "next/server";
import {d1,isLead} from "../_shared";

function beijingDay(timestamp=Date.now()){
 return new Date(timestamp+8*60*60*1000).toISOString().slice(0,10);
}

export async function POST(){
 const now=Date.now();
 await d1().prepare(`
  INSERT INTO site_traffic_daily (day, visits, updated_at)
  VALUES (?, 1, ?)
  ON CONFLICT(day) DO UPDATE SET
   visits = site_traffic_daily.visits + 1,
   updated_at = excluded.updated_at
 `).bind(beijingDay(now),now).run();
 return NextResponse.json({ok:true},{headers:{"cache-control":"no-store"}});
}

export async function GET(req:NextRequest){
 if(!(await isLead(req)))return NextResponse.json({error:"Lead access required"},{status:401});
 const now=Date.now();
 const today=beijingDay(now);
 const weekStart=beijingDay(now-6*24*60*60*1000);
 const row=await d1().prepare(`
  SELECT
   COALESCE(SUM(visits), 0) AS total,
   COALESCE(SUM(CASE WHEN day = ? THEN visits ELSE 0 END), 0) AS today,
   COALESCE(SUM(CASE WHEN day >= ? THEN visits ELSE 0 END), 0) AS week,
   MAX(updated_at) AS last_visit_at
  FROM site_traffic_daily
 `).bind(today,weekStart).first<{total:number;today:number;week:number;last_visit_at:number|null}>();
 return NextResponse.json({
  total:Number(row?.total??0),
  today:Number(row?.today??0),
  week:Number(row?.week??0),
  lastVisitAt:row?.last_visit_at??null,
 },{headers:{"cache-control":"no-store"}});
}
