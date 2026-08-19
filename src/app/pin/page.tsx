import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PIN_COOKIE } from "@/lib/pin";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

async function unlock(formData: FormData) {
  "use server";

  const pin = process.env.COMMAND_CENTER_PIN;
  const entered = String(formData.get("pin") ?? "").trim();

  if (!pin || entered !== pin) redirect("/pin?wrong=1");

  (await cookies()).set(PIN_COOKIE, pin, {
    httpOnly: true, // not readable from JS, so the PIN can't be lifted client-side
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // a year — "type it once per device"
  });

  redirect("/");
}

export default async function PinPage({
  searchParams,
}: {
  searchParams: Promise<{ wrong?: string }>;
}) {
  const { wrong } = await searchParams;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6">
      <form action={unlock} className="glass w-full max-w-xs rounded-2xl p-6 text-center">
        <h1 className="text-base font-semibold text-foreground">Command Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your PIN</p>

        <input
          name="pin"
          type="password"
          // Brings up the number pad on iOS instead of the full keyboard.
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={8}
          autoFocus
          autoComplete="off"
          aria-label="PIN"
          className="mt-4 w-full rounded-lg border border-input bg-secondary px-3 py-2 text-center font-mono text-2xl tracking-[0.5em] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />

        {wrong ? (
          <p className="mt-2 text-sm text-danger">Wrong PIN — try again.</p>
        ) : null}

        <Button type="submit" className="mt-4 w-full">
          Unlock
        </Button>
      </form>
    </main>
  );
}
