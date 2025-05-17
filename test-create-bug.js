import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { ChildProcessTransport } from "@modelcontextprotocol/sdk/client/child-process.js";

async function main() {
  try {
    console.log("Starting test for create_bug tool...");
    
    // Create a transport that connects to the jira-mcp-server
    const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    
    // Create an MCP client
    const client = new McpClient();
    
    // Connect the client to the transport
    await client.connect(transport);
    
    console.log("Connected to jira-mcp-server");
    
    // List available tools to verify create_bug is there
    const tools = await client.listTools();
    console.log("Available tools:", tools.map(t => t.name));
    
    // Check if create_bug tool exists
    if (!tools.some(tool => tool.name === "create_bug")) {
      console.error("create_bug tool not found!");
      process.exit(1);
    }
    
    console.log("create_bug tool is available!");
    
    // Test creating a bug (uncomment to actually create a bug)
    /*
    const result = await client.useTool("create_bug", {
      project: "TEST", // Replace with your project key
      summary: "Test bug created via MCP",
      description: "This is a test bug created using the create_bug MCP tool",
      priority: "Medium",
      additionalLabels: ["test-label"]
    });
    
    console.log("Bug creation result:", result);
    */
    
    console.log("Test completed successfully!");
    
    // Disconnect the client
    await client.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
