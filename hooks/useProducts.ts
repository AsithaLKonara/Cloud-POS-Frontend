import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsService, GetProductsParams } from '../services/products.service';
import { Product } from '../types/product';
import { PaginatedResponse } from '../types/api';

export const PRODUCT_QUERY_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_QUERY_KEYS.all, 'list'] as const,
  list: (params?: GetProductsParams) => [...PRODUCT_QUERY_KEYS.lists(), params] as const,
  infinite: (params?: GetProductsParams) => [...PRODUCT_QUERY_KEYS.lists(), 'infinite', params] as const,
  details: () => [...PRODUCT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_QUERY_KEYS.details(), id] as const,
  detailBySlug: (slug: string) => [...PRODUCT_QUERY_KEYS.details(), 'slug', slug] as const,
};

export function useProducts(params?: GetProductsParams, initialData?: PaginatedResponse<Product>) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.list(params),
    queryFn: () => productsService.getProducts(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData,
  });
}

export function useProductFilters() {
  return useQuery({
    queryKey: [...PRODUCT_QUERY_KEYS.all, 'filters'],
    queryFn: () => productsService.getFilters(),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

export function useInfiniteProducts(params?: GetProductsParams) {
  return useInfiniteQuery({
    queryKey: PRODUCT_QUERY_KEYS.infinite(params),
    queryFn: ({ pageParam = 0 }) => productsService.getProducts({ ...params, skip: pageParam as number, take: params?.take || 12 }),
    getNextPageParam: (lastPage, allPages) => {
      const nextSkip = allPages.length * (params?.take || 12);
      return nextSkip < lastPage.meta.total ? nextSkip : undefined;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialPageParam: 0,
  });
}

export function useProduct(id: string, initialData?: Product) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detail(id),
    queryFn: () => productsService.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData,
  });
}

export function useProductBySlug(slug: string, initialData?: Product) {
  return useQuery({
    queryKey: PRODUCT_QUERY_KEYS.detailBySlug(slug),
    queryFn: () => productsService.getProductBySlug(slug),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5, // 5 minutes
    initialData,
  });
}

export function useScanBarcode() {
  return useMutation({
    mutationFn: (sku: string) => productsService.getProductBySku(sku),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => productsService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.all });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productsService.updateProduct(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(variables.id) });
      if (data.slug) {
        queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detailBySlug(data.slug) });
      }
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productsService.deleteProduct(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
    },
  });
}

export function useBulkEditProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productIds, data }: { productIds: string[]; data: any }) => productsService.bulkEditProducts(productIds, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_QUERY_KEYS.lists() });
    },
  });
}
