import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "./supabase/server";
import { createAdminClient } from "./supabase/admin";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  organizationId: string;
}

/**
 * Extracts and verifies the authenticated user from the current request.
 * Checks both session cookies and the Authorization Bearer header.
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<{ user: AuthenticatedUser | null; error: string | null }> {
  try {
    const supabase = await createServerSupabaseClient();
    
    // Check Authorization header if present
    const authHeader = req?.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (bearerToken && supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(bearerToken);
      if (user && !error) {
        return {
          user: {
            id: user.id,
            email: user.email || "",
          },
          error: null,
        };
      }
    }

    // Check cookie-based session
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (user && !error) {
        return {
          user: {
            id: user.id,
            email: user.email || "",
          },
          error: null,
        };
      }
    }

    // Try admin client with bearer token if server client failed
    if (bearerToken) {
      const adminClient = createAdminClient();
      if (adminClient) {
        const { data: { user }, error } = await adminClient.auth.getUser(bearerToken);
        if (user && !error) {
          return {
            user: {
              id: user.id,
              email: user.email || "",
            },
            error: null,
          };
        }
      }
    }

    return {
      user: null,
      error: "Authentication required. Please sign in to access this resource.",
    };
  } catch (err: any) {
    console.error("Auth verification error:", err);
    return {
      user: null,
      error: err?.message || "Failed to verify authentication session.",
    };
  }
}

/**
 * Ensures an organization exists for the authenticated user and returns its ID.
 * Creates a scoped organization and membership if none exists yet.
 */
export async function getOrCreateUserOrganization(
  userId: string,
  userEmail: string
): Promise<string> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    // Fallback deterministic organization ID based on user ID for offline/mock mode
    return `org-${userId}`;
  }

  try {
    // 1. Check if user is already a member of an organization
    const { data: existingMemberships, error: memErr } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .limit(1);

    if (!memErr && existingMemberships && existingMemberships.length > 0) {
      return existingMemberships[0].organization_id;
    }

    // 2. Ensure user profile exists in profiles table
    await adminClient.from("profiles").upsert(
      {
        id: userId,
        email: userEmail,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );

    // 3. Create a dedicated organization for this user
    const username = userEmail.split("@")[0] || "User";
    const orgName = `${username}'s Workspace`;
    const orgSlug = `org-${userId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 12)}-${Date.now()}`;

    const { data: newOrg, error: orgErr } = await adminClient
      .from("organizations")
      .insert({
        name: orgName,
        slug: orgSlug,
      })
      .select("id")
      .single();

    if (orgErr || !newOrg) {
      console.error("Failed to create user organization:", orgErr);
      throw new Error("Could not initialize user workspace");
    }

    // 4. Add user as owner of the newly created organization
    const { error: memberInsertErr } = await adminClient
      .from("organization_members")
      .insert({
        organization_id: newOrg.id,
        user_id: userId,
        role: "owner",
      });

    if (memberInsertErr) {
      console.error("Failed to create organization membership:", memberInsertErr);
      throw new Error("Could not assign workspace ownership");
    }

    return newOrg.id;
  } catch (err: any) {
    console.error("getOrCreateUserOrganization error:", err);
    throw err;
  }
}

/**
 * Standard 401 Unauthorized response helper.
 */
export function unauthorizedResponse(message = "Unauthorized: Active session required") {
  return NextResponse.json(
    { error: message, authenticated: false },
    { status: 401 }
  );
}

/**
 * Standard 403 Forbidden response helper.
 */
export function forbiddenResponse(message = "Forbidden: Access denied to this resource") {
  return NextResponse.json(
    { error: message },
    { status: 403 }
  );
}
