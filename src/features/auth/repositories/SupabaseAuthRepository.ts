//src/features/auth/repositories/SupabaseAuthRepository.ts

import { supabase } from "@shared/database/supabase";
import type { LoginCredentials, AuthUser } from "../domain/models/Auth";
import type { IAuthRepository } from "../domain/repositories/IAuthRepository";

export class SupabaseAuthRepository implements IAuthRepository {
  async authenticate(credentials: LoginCredentials): Promise<AuthUser> {
    const { data: dbUser, error } = await supabase
      .schema("core")
      .from("users")
      .select("*")
      .eq("username", credentials.username.trim())
      .single();

    if (error || !dbUser) {
      throw new Error("INVALID_CREDENTIALS: Invalid username or password");
    }

    if (dbUser.status !== "active") {
      throw new Error("ACCOUNT_DISABLED: Account is disabled");
    }

    if (!credentials.password || credentials.password.length < 1) {
      throw new Error("INVALID_CREDENTIALS: Password is required");
    }

    if (dbUser.password !== credentials.password) {
      throw new Error("INVALID_CREDENTIALS: Invalid username or password");
    }

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: dbUser.email,
        password: credentials.password,
      });

      if (authError) {
        console.warn(
          "[SupabaseAuthRepository] Supabase Auth sync warning:",
          authError.message,
        );
      }
    } catch (syncError) {
      console.error("[SupabaseAuthRepository] Auth sync failed:", syncError);
    }

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      fullName: dbUser.full_name,
      role: dbUser.role,
      department: dbUser.department,
      customPermissions: dbUser.custom_permissions || [],
      basePermissions: [],
    };
  }

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error(
        "[SupabaseAuthRepository] Failed to sign out from Supabase Auth:",
        error,
      );
    }
  }
}
