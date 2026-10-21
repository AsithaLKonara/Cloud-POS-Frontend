import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tenantService, TenantSummary } from "@/services/tenant.service";

export function useCurrentTenant() {
  return useQuery({
    queryKey: ["current-tenant"],
    queryFn: () => tenantService.getCurrentTenant(),
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}

export function useTenant(id?: string) {
  return useQuery({
    queryKey: ["tenant", id],
    queryFn: () => (id ? tenantService.getTenantById(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export function useTenantUsage(id?: string) {
  return useQuery({
    queryKey: ["tenant-usage", id],
    queryFn: () => (id ? tenantService.getTenantUsage(id) : null),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useUpdateCurrentTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<TenantSummary>) => tenantService.updateCurrentTenant(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["current-tenant"] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TenantSummary> }) =>
      tenantService.updateTenant(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tenant", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["current-tenant"] });
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
    },
  });
}
