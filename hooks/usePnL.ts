import { useQuery } from '@tanstack/react-query';
import { pnlService, PnLResponse } from '../services/pnl.service';

export function usePnLStatement(params?: { branchId?: string; startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: ['pnl-statement', params],
    queryFn: () => pnlService.getStatement(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}
