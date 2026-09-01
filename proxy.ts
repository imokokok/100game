import {NextResponse,type NextRequest} from "next/server";

export function proxy(request:NextRequest){
 const response=NextResponse.next();
 response.headers.set("X-Content-Type-Options","nosniff");
 response.headers.set("Referrer-Policy","strict-origin-when-cross-origin");
 response.headers.set("X-Frame-Options","DENY");
 response.headers.set("Permissions-Policy","camera=(), microphone=(), geolocation=(), payment=(), usb=()");
 const pathname=request.nextUrl.pathname;
 if(pathname.startsWith("/video/")){
  response.headers.set("Cache-Control","public, max-age=31536000, immutable");
 }else if(request.method==="GET"&&!pathname.startsWith("/api/")&&!/\.[a-z0-9]{2,8}$/i.test(pathname)){
  // Phone browsers and embedded WeChat tabs must revalidate the document so
  // a newly published page cannot stay behind an old HTML shell.
  response.headers.set("Cache-Control","no-store, no-cache, must-revalidate, max-age=0");
  response.headers.set("Pragma","no-cache");
  response.headers.set("Expires","0");
 }
 return response;
}

export const config={matcher:["/((?!_next/static|_next/image|favicon.ico).*)"]};
