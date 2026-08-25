import { Router } from 'express';

export interface AutoCartConfig {
  merchantKey: string;
  merchantSecret: string;
  nexusUrl?: string;
  fetchCatalog?: () => Promise<Array<{ sku: string; name: string; price: number; stock: number }>>;
  fetchProduct: (sku: string) => Promise<{ sku: string; price: number; stock: number } | null>;
}

export class AutoCartGateway {
  constructor(config: AutoCartConfig);
  createRouter(): Router;
}
