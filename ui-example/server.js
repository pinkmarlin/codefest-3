import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

import { z } from "zod";

function getMcpServer() {
  const server = new McpServer({
    name: "pmt-mcp-server",
    version: "1.0.0",
  });

  // Dynamic resource with parameters
  server.resource(
    "product",
    new ResourceTemplate("products://{productId}", { list: undefined }),
    async (uri, { productId }) => ({
      contents: [
        {
          uri: uri.href,
          text: `product info for ${productId}`,
        },
      ],
    })
  );

  server.tool(
    "rent-product",
    {
      productName: z.string(),
      productId: z.string(),
      startDate: z.string(),
      endDate: z.string(),
    },
    async ({ productName, productId, startDate, endDate }) => {
      //   const response = await fetch(`https://api.weather.com/${city}`);
      //   const data = await response.text();
      const orderId = "rord12345";
      return {
        content: [{ type: "text", text: `Rental order created at ${orderId}` }],
      };
    }
  );

  return server;
}

const app = express();

let transport;
app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/messages", res);
  await getMcpServer().connect(transport);
});

app.post("/messages", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MCP SSE Server is running on http://localhost:${port}/sse`);
});