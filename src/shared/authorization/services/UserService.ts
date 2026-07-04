// src/shared/authorization/services/UserService.ts

import { User, UserFormData, UserStatus } from '../types';
import { supabase } from '@shared/database/supabase';
import { authService } from '@features/auth/services/AuthService';
import { eventBus } from '@infra/events';

class UserService {
  private static instance: UserService;

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  private dbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email,
      fullName: dbUser.full_name,
      role: dbUser.role,
      department: dbUser.department,
      status: dbUser.status as UserStatus,
      customPermissions: dbUser.custom_permissions || [],
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[UserService] Failed to get users:', error);
      return [];
    }

    return data.map(this.dbUserToUser);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    return this.dbUserToUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .single();

    if (error || !data) return undefined;
    return this.dbUserToUser(data);
  }

  async createUser(formData: UserFormData): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: formData.username,
        email: formData.email,
        full_name: formData.fullName,
        password: formData.password || '',
        role: formData.role,
        department: formData.department || '',
        status: formData.status || 'active',
        custom_permissions: formData.customPermissions || [],
      })
      .select()
      .single();

    if (error) {
      console.error('[UserService] Failed to create user:', error);
      throw new Error(error.message);
    }

    const user = this.dbUserToUser(data);

    eventBus.publish({
      type: 'user.created' as any,
      payload: { userId: user.id, username: user.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return user;
  }

  async updateUser(id: string, formData: Partial<UserFormData>): Promise<User> {
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (formData.username !== undefined) updateData.username = formData.username;
    if (formData.email !== undefined) updateData.email = formData.email;
    if (formData.fullName !== undefined) updateData.full_name = formData.fullName;
    if (formData.role !== undefined) updateData.role = formData.role;
    if (formData.department !== undefined) updateData.department = formData.department;
    if (formData.status !== undefined) updateData.status = formData.status;
    if (formData.customPermissions !== undefined) {
      updateData.custom_permissions = formData.customPermissions;
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[UserService] Failed to update user:', error);
      throw new Error(error.message);
    }

    const user = this.dbUserToUser(data);

    // 🔧 Sync session اگر کاربر فعلی است
    authService.updateCurrentUser(user);

    eventBus.publish({
      type: 'user.updated' as any,
      payload: { userId: user.id, username: user.username },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[UserService] Failed to delete user:', error);
      throw new Error(error.message);
    }

    eventBus.publish({
      type: 'user.deleted' as any,
      payload: { userId: id },
      timestamp: new Date(),
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'user-management',
    });
  }

  async changePassword(id: string, newPassword: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .update({ password: newPassword, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export const userService = UserService.getInstance();