import { experimental_createMCPClient, tool } from "ai";
import { z } from "zod";

const PORT = process.env.PORT || 3000;

import { fetchGuitars } from "./apis.js";

const mcpClient = await experimental_createMCPClient({
  transport: {
    type: "sse",
    url: `http://localhost:${PORT}/sse`,
  },
  name: "Dr. Triage's MCP Server",
});

const getGuitars = tool({
  description: "Get all guitars from the database",
  parameters: z.object({}),
  execute: async () => await fetchGuitars(),
});

export default async function getTools() {
  const tools = await mcpClient.tools();
  return {
    ...tools,
    getGuitars,
  };
}