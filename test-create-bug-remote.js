// This script will test creating a bug ticket with the remote Jira MCP server

import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { HttpTransport } from "@modelcontextprotocol/sdk/client/http.js";

async function main() {
  try {
    console.log("Starting test for create_bug tool with remote server...");
    
    // Create a transport that connects to the remote Jira MCP server
    const transport = new HttpTransport("https://jira-mcp-server-89b2c65441ff.herokuapp.com/jira");
    
    // Create an MCP client
    const client = new McpClient();
    
    // Connect the client to the transport
    await client.connect(transport);
    
    console.log("Connected to remote Jira MCP server");
    
    // List available tools
    const tools = await client.listTools();
    console.log("Available tools:", tools.map(t => t.name));
    
    // Get the schema for the create_bug tool
    const createBugTool = tools.find(t => t.name === "create_bug");
    if (createBugTool) {
      console.log("Found create_bug tool with schema:", JSON.stringify(createBugTool.schema, null, 2));
    } else {
      console.log("create_bug tool not found!");
    }
    
    // Disconnect the client
    await client.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
