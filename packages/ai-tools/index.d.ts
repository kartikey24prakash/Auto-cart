export interface AutoCartBuyerToolConfig {
  buyerKey: string;
}

export class AutoCartBuyerTool {
  constructor(config: AutoCartBuyerToolConfig);
  getOpenAISchema(): any;
  execute(args: { merchantUrl: string; sku: string; qty?: number }): Promise<string>;
}
