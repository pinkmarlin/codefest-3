import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { ChildProcessTransport } from "@modelcontextprotocol/sdk/client/child-process.js";

async function main() {
  try {
    // Create a transport that connects to the jira-mcp-server
    const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    
    // Create an MCP client
    const client = new McpClient();
    
    // Connect the client to the transport
    await client.connect(transport);
    
    console.log("Connected to jira-mcp-server");
    
    // Use the get_bug_tickets tool
    const result = await client.useTool("get_bug_tickets", {
      // Use the project key from the environment variable
      // maxResults: 5,
      // status: "Open"
    });
    
    console.log("Result:", result);
    
    // Disconnect the client
    await client.disconnect();
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
