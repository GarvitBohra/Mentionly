import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/** The signed-in Supabase user (cookie session or Bearer token), or null. */
export async function getAuthenticatedUser(req?: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createServerSupabaseClient();
    if (!supabase) return null;

    const header = req?.headers.get("authorization");
    const bearer = header?.startsWith("Bearer ") ? header.substring(7) : undefined;
    const { data } = bearer ? await supabase.auth.getUser(bearer) : await supabase.auth.getUser();
    return data.user ? { id: data.user.id, email: data.user.email || "" } : null;
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
}
