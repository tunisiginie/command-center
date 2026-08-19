"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Passwordless sign-in: this app has no separate signup flow — one email
 * field, one magic link. RLS scopes every signed-in user to their own tiles,
 * so leaving sign-up open costs nothing; a stranger who signs in just gets
 * their own empty board and can never see yours.
 */
export function AuthForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured()) {
      toast.error("Supabase isn't configured yet. Add your keys to .env.local.");
      return;
    }
    setPending(true);
    const supabase = createClient();
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="glass w-full max-w-sm rounded-2xl p-6 text-center">
        <p className="text-sm font-medium text-foreground">Check your email</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We sent a sign-in link to {email}. Open it on this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="glass w-full max-w-sm space-y-4 rounded-2xl p-6"
    >
      <div>
        <p className="text-sm font-medium text-foreground">Sign in</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll email you a link — no password to remember.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send magic link"}
      </Button>
    </form>
  );
}
