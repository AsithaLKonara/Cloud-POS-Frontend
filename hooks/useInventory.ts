import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';

// --- Branches ---
export const useBranches = () => {
  return useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const res = await api.get('/inventory/branches');
      return res.data;
    },
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string, code: string, address?: string, phone?: string, type?: string, isActive?: boolean }) => {
      const res = await api.post('/inventory/branches', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const res = await api.put(`/inventory/branches/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useDeleteBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/inventory/branches/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

// --- Inventory ---
export const useInventory = (branchId?: string, search?: string, status?: string, page: number = 1) => {
  return useQuery({
    queryKey: ['inventory', branchId, search, status, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      params.append('page', page.toString());
      const res = await api.get(`/inventory?${params.toString()}`);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useInventoryStats = (branchId?: string) => {
  return useQuery({
    queryKey: ['inventory-stats', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      const res = await api.get(`/inventory/stats?${params.toString()}`);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { variantId: string; branchId: string; type: 'RECEIVE' | 'DEDUCT'; quantity: number; reason: string }) => {
      const res = await api.post('/inventory/adjust', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] });
    },
  });
};

// --- Transactions ---
export const useInventoryTransactions = (branchId?: string) => {
  return useQuery({
    queryKey: ['inventory-transactions', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      const res = await api.get(`/inventory/transactions?${params.toString()}`);
      return res.data;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
};

// --- Transfers ---
export const useTransfers = (branchId?: string) => {
  return useQuery({
    queryKey: ['stock-transfers', branchId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (branchId) params.append('branchId', branchId);
      const res = await api.get(`/inventory/transfers?${params.toString()}`);
      return res.data;
    },
  });
};

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { variantId: string; fromBranchId: string; toBranchId: string; quantity: number; notes?: string }) => {
      const res = await api.post('/inventory/transfers', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
    },
  });
};

export const useUpdateTransferStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await api.put(`/inventory/transfers/${id}/status`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
};
