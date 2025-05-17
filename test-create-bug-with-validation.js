import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { ChildProcessTransport } from "@modelcontextprotocol/sdk/client/child-process.js";

async function main() {
  try {
    console.log("Starting test for create_bug tool with validation...");
    
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
    
    // Test case 1: Incomplete information (missing curl and trace ID)
    console.log("\nTest Case 1: Incomplete information (missing curl and trace ID)");
    try {
      const incompleteResult = await client.useTool("create_bug", {
        summary: "API returns 500 error",
        description: "When accessing the API, it returns a 500 error.",
        priority: "Medium"
      });
      
      console.log("Create bug result (incomplete):", JSON.stringify(incompleteResult, null, 2));
      console.log("Expected validation to fail, but it succeeded. This is a bug!");
    } catch (error) {
      console.log("Create bug failed as expected:", error.message);
    }
    
    // Test case 2: Complete information with curl command
    console.log("\nTest Case 2: Complete information with curl command");
    try {
      const completeWithCurlResult = await client.useTool("create_bug", {
        summary: "API returns 500 error when accessing /users endpoint",
        description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
        priority: "High",
        curlCommand: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
      });
      
      console.log("Create bug result (complete with curl):", JSON.stringify(completeWithCurlResult, null, 2));
    } catch (error) {
      console.error("Create bug with curl failed unexpectedly:", error.message);
    }
    
    // Test case 3: Complete information with trace ID
    console.log("\nTest Case 3: Complete information with trace ID");
    try {
      const completeWithTraceResult = await client.useTool("create_bug", {
        summary: "API returns 500 error when accessing /users endpoint",
        description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
        priority: "High",
        traceId: "abc123-xyz-456"
      });
      
      console.log("Create bug result (complete with trace ID):", JSON.stringify(completeWithTraceResult, null, 2));
    } catch (error) {
      console.error("Create bug with trace ID failed unexpectedly:", error.message);
    }
    
    // Disconnect the client
    await client.disconnect();
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
