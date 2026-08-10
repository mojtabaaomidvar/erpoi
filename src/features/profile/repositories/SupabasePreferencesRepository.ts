// src/features/profile/repositories/SupabasePreferencesRepository.ts
import { supabase } from "@shared/database/supabase";
import type { ThemePreferences } from "@features/theme/domain/ThemePreferences";

export class SupabasePreferencesRepository {
  async getByUserId(userId: string): Promise<ThemePreferences | null> {
    const { data, error } = await supabase
      .from("user_preferences")
      .select("preferences")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("SupabasePreferencesRepository.getByUserId error", error);
      return null;
    }

    return (data?.preferences as ThemePreferences) ?? null;
  }

  async upsert(userId: string, prefs: ThemePreferences) {
    const { data, error } = await supabase
      .from("user_preferences")
      // supabase-js typing expects onConflict as string (comma separated) in some versions
      .upsert(
        { user_id: userId, preferences: prefs },
        // pass column name directly
        { onConflict: "user_id" },
      )
      .select();

    if (error) {
      console.error("SupabasePreferencesRepository.upsert error", error);
      throw error;
    }

    return data;
  }
}
