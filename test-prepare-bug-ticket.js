import { McpClient } from "@modelcontextprotocol/sdk/client/mcp.js";
import { ChildProcessTransport } from "@modelcontextprotocol/sdk/client/child-process.js";

async function main() {
  try {
    console.log("Starting test for prepare_bug_ticket tool...");
    
    // Create a transport that connects to the jira-mcp-server
    const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    
    // Create an MCP client
    const client = new McpClient();
    
    // Connect the client to the transport
    await client.connect(transport);
    
    console.log("Connected to jira-mcp-server");
    
    // List available tools to verify prepare_bug_ticket is there
    const tools = await client.listTools();
    console.log("Available tools:", tools.map(t => t.name));
    
    // Check if prepare_bug_ticket tool exists
    if (!tools.some(tool => tool.name === "prepare_bug_ticket")) {
      console.error("prepare_bug_ticket tool not found!");
      process.exit(1);
    }
    
    console.log("prepare_bug_ticket tool is available!");
    
    // Test case 1: Incomplete information (missing curl and trace ID)
    console.log("\nTest Case 1: Incomplete information (missing curl and trace ID)");
    const incompleteResult = await client.useTool("prepare_bug_ticket", {
      summary: "API returns 500 error",
      description: "When accessing the API, it returns a 500 error.",
      priority: "Medium"
    });
    
    console.log("Validation result (incomplete):", JSON.stringify(incompleteResult, null, 2));
    
    // Test case 2: Complete information with curl command
    console.log("\nTest Case 2: Complete information with curl command");
    const completeWithCurlResult = await client.useTool("prepare_bug_ticket", {
      summary: "API returns 500 error when accessing /users endpoint",
      description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      priority: "High",
      curlCommand: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
    });
    
    console.log("Validation result (complete with curl):", JSON.stringify(completeWithCurlResult, null, 2));
    
    // Test case 3: Complete information with trace ID
    console.log("\nTest Case 3: Complete information with trace ID");
    const completeWithTraceResult = await client.useTool("prepare_bug_ticket", {
      summary: "API returns 500 error when accessing /users endpoint",
      description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      priority: "High",
      traceId: "abc123-xyz-456"
    });
    
    console.log("Validation result (complete with trace ID):", JSON.stringify(completeWithTraceResult, null, 2));
    
    // Test case 4: Invalid priority
    console.log("\nTest Case 4: Invalid priority");
    const invalidPriorityResult = await client.useTool("prepare_bug_ticket", {
      summary: "API returns 500 error when accessing /users endpoint",
      description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      priority: "Super High",
      curlCommand: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
    });
    
    console.log("Validation result (invalid priority):", JSON.stringify(invalidPriorityResult, null, 2));
    
    // Disconnect the client
    await client.disconnect();
    
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
