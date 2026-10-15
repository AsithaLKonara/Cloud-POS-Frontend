import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { analyticsService } from '@/services/analytics.service';

export const useBusinessOverview = (period: string, branch: string) => {
  return useQuery({
    queryKey: ['analytics', 'overview', period, branch],
    queryFn: () => analyticsService.getBusinessOverview(period, branch),
  });
};

export const useBusinessOverviewSuspense = (period: string, branch: string) => {
  return useSuspenseQuery({
    queryKey: ['analytics', 'overview', period, branch],
    queryFn: () => analyticsService.getBusinessOverview(period, branch),
  });
};

export const useExecutiveOverview = (period: string, branchId?: string) => {
  return useQuery({
    queryKey: ['analytics', 'executive', period, branchId],
    queryFn: () => analyticsService.getExecutiveOverview(period, branchId),
  });
};

export const useBranchDashboard = (branchId?: string) => {
  return useQuery({
    queryKey: ['analytics', 'branch-dashboard', branchId],
    queryFn: () => analyticsService.getBranchDashboard(branchId),
    refetchInterval: 30000, // Live poll every 30s
  });
};
