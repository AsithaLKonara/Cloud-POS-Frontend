import { api } from './api';
import { Product } from '../types/product';
import { PaginatedResponse } from '../types/api';

export interface GetProductsParams {
  skip?: number;
  take?: number;
  search?: string;
  category?: string;
  productType?: string;
  brand?: string;
  viscosity?: string;
  oilType?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  status?: string;
}

export const productsService = {
  async getProducts(params?: GetProductsParams): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params,
    });
    return data;
  },

  async getFilters(): Promise<{ colors: string[]; sizes: string[] }> {
    const { data } = await api.get<{ colors: string[]; sizes: string[] }>('/products/filters');
    return data;
  },

  async getProductById(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async getProductBySlug(slug: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/slug/${slug}`);
    return data;
  },

  async getProductBySku(sku: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/sku/${sku}`);
    return data;
  },

  async createProduct(product: any): Promise<Product> {
    const { data } = await api.post<Product>('/products', product);
    return data;
  },

  async updateProduct(id: string, product: any): Promise<Product> {
    const { data } = await api.put<Product>(`/products/${id}`, product);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async bulkEditProducts(productIds: string[], data: any): Promise<void> {
    await api.patch('/products/bulk-edit', { productIds, data });
  },
};
