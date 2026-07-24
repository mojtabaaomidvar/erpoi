import { useState, useEffect, useCallback } from "react";
import { clientAppService } from "@/features/client-management/application";
import { contractAppService } from "@/features/contract-management/application";
import { userAppService } from "@/shared/authorization";
import { showToast } from "@shared/ui/ToastContainer";
import type { Client } from "@/features/client-management/domain/models/Client";
import type { Contract } from "@/features/contract-management/domain";
import type { User } from "@/shared/authorization";

export function useProjectForm() {
  const [clients, setClients] = useState<Client[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [availableServiceTypes, setAvailableServiceTypes] = useState<string[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [fetchedClients, fetchedUsers] = await Promise.all([
          clientAppService.getAll(),
          userAppService.getAllUsers(),
        ]);
        setClients(fetchedClients);
        setUsers(fetchedUsers.filter((u: User) => u.status === "active"));
      } catch (err: any) {
        showToast("error", "Load Failed", err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const loadContracts = useCallback(async (clientId: string) => {
    if (!clientId) {
      setContracts([]);
      setAvailableServiceTypes([]);
      return;
    }
    try {
      const data = await contractAppService.getByClientId(clientId);
      setContracts(data);
    } catch (err: any) {
      showToast("error", "Load Contracts Failed", err.message);
      setContracts([]);
      setAvailableServiceTypes([]);
    }
  }, []);

  const updateAvailableServiceTypes = useCallback(
    (contractId: string) => {
      if (!contractId) {
        setAvailableServiceTypes([]);
        return;
      }

      const selectedContract = contracts.find((c) => c.id === contractId);
      if (selectedContract) {
        const services = (selectedContract as any).service_description || [];
        setAvailableServiceTypes(services);
      } else {
        setAvailableServiceTypes([]);
      }
    },
    [contracts],
  );

  const clearContracts = useCallback(() => {
    setContracts([]);
    setAvailableServiceTypes([]);
  }, []);

  return {
    clients,
    contracts,
    users,
    availableServiceTypes,
    isLoading,
    loadContracts,
    updateAvailableServiceTypes,
    clearContracts,
  };
}
