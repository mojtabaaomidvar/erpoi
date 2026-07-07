// src/shared/authorization/services/DepartmentService.ts

import { supabase } from '@shared/database/supabase';
import type { DBDepartment } from '@shared/database/types';

class DepartmentService {
  async getAll(): Promise<DBDepartment[]> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('[DepartmentService] Failed to get departments:', error);
      return [];
    }

    return (data || []).map(d => ({
      id: d.id,
      name: d.name,
      description: d.description,
      createdAt: d.created_at,
      updatedAt: d.updated_at,
    }));
  }

  async getById(id: string): Promise<DBDepartment | null> {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async create(department: Omit<DBDepartment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DBDepartment> {
    const id = `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('departments')
      .insert({
        id,
        name: department.name,
        description: department.description,
      })
      .select()
      .single();

    if (error) {
      console.error('[DepartmentService] Failed to create department:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async update(id: string, department: Partial<DBDepartment>): Promise<DBDepartment> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (department.name !== undefined) updateData.name = department.name;
    if (department.description !== undefined) updateData.description = department.description;

    const { data, error } = await supabase
      .from('departments')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[DepartmentService] Failed to update department:', error);
      throw new Error(error.message);
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('departments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DepartmentService] Failed to delete department:', error);
      throw new Error(error.message);
    }
  }
}

export const departmentService = new DepartmentService();