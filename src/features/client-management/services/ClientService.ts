// src/features/client-management/services/ClientService.ts

import { supabase } from "@shared/database/supabase";
import type { Client } from "@/types/client";

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

    const clientIds = (data || []).map((c) => c.id);
    const { data: allContacts } = await supabase
      .from("client_contacts")
      .select("*")
      .in("client_id", clientIds.length > 0 ? clientIds : ["none"]);

    const contactsMap = new Map<string, any[]>();
    (allContacts || []).forEach((contact) => {
      const existing = contactsMap.get(contact.client_id) || [];
      existing.push(contact);
      contactsMap.set(contact.client_id, existing);
    });

    return (data || []).map((client) =>
      this.dbToClient(client, contactsMap.get(client.id) || []),
    );
  }

  async getById(id: string): Promise<Client | null> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;

    const { data: contacts } = await supabase
      .from("client_contacts")
      .select("*")
      .eq("client_id", id)
      .order("created_at", { ascending: true });

    return this.dbToClient(data, contacts || []);
  }

  async create(client: Partial<Client>): Promise<Client> {
    const { contactPersons, ...clientWithoutContacts } = client;

    const dbClient = this.clientToDb(clientWithoutContacts);

    const clientId =
      dbClient.id ||
      `c_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 🔧 INSERT client با contact_persons و contacts
    const { data, error } = await supabase
      .from("clients")
      .insert({
        ...dbClient,
        id: clientId,
        contact_persons: contactPersons || [], // 🔧 ذخیره در jsonb
        contacts: contactPersons?.length || 0, // 🔧 ذخیره تعداد
      })
      .select()
      .single();

    if (error) {
      console.error("[ClientService] Failed to create client:", error);
      throw new Error(error.message);
    }

    // 🔧 INSERT contact persons در جدول جداگانه
    const createdContacts = await this.insertContactPersons(
      clientId,
      contactPersons || [],
    );

    return this.dbToClient(data, createdContacts);
  }

  async update(id: string, client: Partial<Client>): Promise<Client> {
    const {
      contactPersons,
      contacts,
      contracts,
      category,
      ...clientWithoutContacts
    } = client;

    const dbClient = this.clientToDb(clientWithoutContacts);

    console.log("[ClientService] 📝 Updating client:", {
      id,
      data: dbClient,
      contactsToSync: contactPersons?.length || 0,
    });

    // 🔧 UPDATE client با contact_persons و contacts
    const { data, error } = await supabase
      .from("clients")
      .update({
        ...dbClient,
        contact_persons: contactPersons || [],
        contacts: contactPersons?.length || 0,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[ClientService] ❌ Failed to update client:", error);
      throw new Error(error.message);
    }

    // 🔧 UPDATE contact persons در جدول جداگانه
    let updatedContacts: any[] = [];
    if (contactPersons !== undefined) {
      // حذف contacts قبلی
      await supabase.from("client_contacts").delete().eq("client_id", id);

      // اضافه کردن contacts جدید
      updatedContacts = await this.insertContactPersons(id, contactPersons);
    } else {
      // دریافت contacts فعلی
      const { data: existing } = await supabase
        .from("client_contacts")
        .select("*")
        .eq("client_id", id);
      updatedContacts = existing || [];
    }

    console.log("[ClientService] ✅ Client updated:", {
      id,
      contactsCount: updatedContacts.length,
    });

    return this.dbToClient(data, updatedContacts);
  }

  async delete(id: string): Promise<void> {
    await supabase.from("client_contacts").delete().eq("client_id", id);

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      console.error("[ClientService] Failed to delete client:", error);
      throw new Error(error.message);
    }
  }

  private async insertContactPersons(
    clientId: string,
    contactPersons: any[],
  ): Promise<any[]> {
    if (!contactPersons || contactPersons.length === 0) {
      return [];
    }

    const contactsToInsert = contactPersons.map((cp) => ({
      id:
        cp.id || `cc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      client_id: clientId,
      name: cp.name,
      position: cp.position || null,
      mobile: cp.mobile,
      email: cp.email || null,
      department: cp.department || null,
    }));

    const { data, error } = await supabase
      .from("client_contacts")
      .insert(contactsToInsert)
      .select();

    if (error) {
      console.warn("[ClientService] ⚠️ Failed to insert contacts:", error);
      return [];
    }

    return data || [];
  }

  private dbToClient(dbClient: any, contacts: any[]): Client {
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
      contactPersons: (contacts || []).map((cp: any) => ({
        id: cp.id,
        name: cp.name,
        position: cp.position || "",
        mobile: cp.mobile || "",
        email: cp.email || "",
        department: cp.department || "",
      })),
      logoColor: dbClient.logo_color || "from-blue-500 to-purple-600",
      contracts: 0,
      contacts: contacts?.length || 0,
      registration_no: dbClient.registration_no,
      economic_code: dbClient.economic_code,
      abbreviated_name: dbClient.abbreviated_name,
      company_type: dbClient.company_type,
      address_en: dbClient.address_en || "",
      address_fa: dbClient.address_fa || "",
      createdAt: dbClient.created_at,
      updatedAt: dbClient.updated_at,
    } as Client;
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
      logo_color: client.logoColor,
      registration_no: client.registration_no,
      economic_code: client.economic_code,
      abbreviated_name: client.abbreviated_name,
      company_type: client.company_type,
      address_en: client.address_en,
      address_fa: client.address_fa,
    };
  }
}

export const clientService = new ClientService();
