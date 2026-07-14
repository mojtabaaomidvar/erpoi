// src/features/billing/services/InvoiceService.ts

import { supabase } from "@shared/database/supabase";

class InvoiceService {
  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[InvoiceService] Failed to get invoices:", error);
      return [];
    }

    return data || [];
  }

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data;
  }

  async create(invoice: any): Promise<any> {
    const id = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from("invoices")
      .insert({
        id,
        ...invoice,
      })
      .select()
      .single();

    if (error) {
      console.error("[InvoiceService] Failed to create invoice:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async update(id: string, invoice: any): Promise<any> {
    const { data, error } = await supabase
      .from("invoices")
      .update({
        ...invoice,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[InvoiceService] Failed to update invoice:", error);
      throw new Error(error.message);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[InvoiceService] Failed to delete invoice:", error);
      throw new Error(error.message);
    }
  }
}

export const invoiceService = new InvoiceService();