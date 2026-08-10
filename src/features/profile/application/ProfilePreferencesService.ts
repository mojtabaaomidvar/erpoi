// src/features/profile/application/ProfilePreferencesService.ts
import type { ThemePreferences } from "@features/theme/domain/ThemePreferences";
import { SupabasePreferencesRepository } from "@features/profile/repositories/SupabasePreferencesRepository";
import { authAppService } from "@features/auth";
import { profileRepository } from "@features/profile";

const repo = new SupabasePreferencesRepository();
export const ProfilePreferencesService = {
  async loadForCurrentUser(): Promise<ThemePreferences | null> {
    const session = authAppService.getSession();
    if (!session) return null;

    const userId =
      (session as any).user?.id ||
      (session as any).user_id ||
      (session as any).sub;
    const token = (session as any).token;

    // Try remote profile first
    if (token && profileRepository) {
      try {
        const profile = await profileRepository.getProfile(token);
        const prefs = profile?.preferences ?? null;
        if (prefs) return prefs as ThemePreferences;
      } catch (err) {
        console.warn(
          "ProfilePreferencesService: remote load failed, falling back to supabase",
          err,
        );
      }
    }

    // Fallback to Supabase-based preferences using user id
    if (!userId) return null;
    return await repo.getByUserId(userId);
  },

  async saveForCurrentUser(prefs: ThemePreferences) {
    const session = authAppService.getSession();
    if (!session) throw new Error("Not authenticated");
    const userId =
      (session as any).user?.id ||
      (session as any).user_id ||
      (session as any).sub;
    const token = (session as any).token;

    // Try remote profile update first
    if (token && profileRepository) {
      try {
        return await profileRepository.updateProfile(token, {
          preferences: prefs,
        });
      } catch (err) {
        console.warn(
          "ProfilePreferencesService: remote save failed, falling back to supabase",
          err,
        );
      }
    }

    if (!userId) throw new Error("Missing user id in session");
    return await repo.upsert(userId, prefs);
  },
};
