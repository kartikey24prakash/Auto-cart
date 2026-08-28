# @autocart/ai-tools

The official OpenAI/LangChain tools for the AutoCart network.

This package provides pre-built function-calling schemas and execution logic to instantly give your AI Agent the ability to securely search and purchase products from verified merchants on the AutoCart network.

## Installation

```bash
npm install @autocart/ai-tools
```

## Usage (LangChain / LangGraph)

```javascript
import { createReactAgent } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { AutoCartSearchTool, AutoCartBuyerTool } from "@autocart/ai-tools";

const searchApi = new AutoCartSearchTool({ networkUrl: 'https://api.autocart.network' });
const searchTool = tool(
  async (args) => searchApi.execute(args),
  { name: searchApi.getOpenAISchema().name, description: searchApi.getOpenAISchema().description, schema: searchApi.getOpenAISchema().parameters }
);

const buyApi = new AutoCartBuyerTool({ buyerKey: process.env.AUTOCART_BUYER_KEY });
const buyTool = tool(
  async (args) => buyApi.execute(args),
  { name: buyApi.getOpenAISchema().name, description: buyApi.getOpenAISchema().description, schema: buyApi.getOpenAISchema().parameters }
);

const agent = createReactAgent({
  llm: mistralModel,
  tools: [searchTool, buyTool]
});
```
