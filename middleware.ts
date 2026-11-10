import { NextResponse, type NextRequest } from "next/server";
import { PIN_COOKIE } from "@/lib/pin";

/**
 * PIN gate. Runs before any page render, so a visitor without the PIN never
 * receives the app shell or the list of links in it.
 *
 * The gate disables itself when COMMAND_CENTER_PIN is unset, so a fresh clone
 * with no env runs open rather than locking the owner out of their own dev
 * server.
 */
export function middleware(request: NextRequest) {
  const pin = process.env.COMMAND_CENTER_PIN;
  if (!pin) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/pin")) return NextResponse.next();

  if (request.cookies.get(PIN_COOKIE)?.value === pin) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/pin";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and the icon/manifest files. Those
     * stay public on purpose: iOS reads the manifest and icons while
     * installing to the home screen, before any cookie exists.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
