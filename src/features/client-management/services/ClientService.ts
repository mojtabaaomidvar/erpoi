// src/features/client-management/services/ClientService.ts

import { supabase } from "@shared/database/supabase";
import type { Client } from "@entities/contract/types";

class ClientService {
  async getAll(): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ClientService] Failed to get clients:", error);
      return [];
    }

    return (data || []).map(this.dbToClient);
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return this.dbToClient(data);
  }

  async create(client: Partial<Client>): Promise<Client> {
    const dbClient = this.clientToDb(client);

    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...dbClient,
        id:
          dbClient.id ||
          `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      })
      .select()
      .single();

    if (error) {
      console.error("[ClientService] Failed to create client:", error);
      throw new Error(error.message);
    }

    return this.dbToClient(data);
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const dbClient = this.clientToDb(client);

    const { data, error } = await supabase
      .from("clients")
      .update({ ...dbClient, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ClientService] Failed to update client:", error);
      throw new Error(error.message);
    }

    return this.dbToClient(data);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      console.error("[ClientService] Failed to delete client:", error);
      throw new Error(error.message);
    }
  }

  private dbToClient(dbClient: any): Client {
    return {
      id: dbClient.id,
      name_en: dbClient.name_en,
      name_fa: dbClient.name_fa || "",
      type: dbClient.type,
      national_id: dbClient.national_id || "",
      phone: dbClient.phone || "",
      email: dbClient.email || "",
      emails: dbClient.emails || [],
      departments: dbClient.departments || [],
      contactPersons: dbClient.contact_persons || [],
      logoColor: dbClient.logo_color || "from-blue-500 to-purple-600",
      contracts: dbClient.contracts || 0,
      contacts: dbClient.contacts || 0,
      registration_no: dbClient.registration_no,
      economic_code: dbClient.economic_code,
      abbreviated_name: dbClient.abbreviated_name,
      createdAt: dbClient.created_at,
      updatedAt: dbClient.updated_at,
    };
  }

  private clientToDb(client: Partial<Client>): any {
    return {
      name_en: client.name_en,
      name_fa: client.name_fa,
      type: client.type,
      national_id: client.national_id,
      phone: client.phone,
      email: client.email,
      emails: client.emails || [],
      departments: client.departments || [],
      contact_persons: client.contactPersons || [],
      logo_color: client.logoColor,
      registration_no: client.registration_no,
      economic_code: client.economic_code,
      abbreviated_name: client.abbreviated_name,
    };
  }
}

export const clientService = new ClientService();
