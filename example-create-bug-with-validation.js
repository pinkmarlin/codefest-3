/**
 * Example script showing how to use the create_bug tool with validation
 * 
 * This script demonstrates how to create a bug ticket using the Jira MCP server
 * with the new validation and curl command or trace ID requirements.
 * Note: This is an example and won't actually run without proper setup.
 */

// Import required modules (in a real application)
// const { McpClient } = require("@modelcontextprotocol/sdk/client/mcp");
// const { ChildProcessTransport } = require("@modelcontextprotocol/sdk/client/child-process");

async function createBugWithValidationExample() {
  try {
    console.log("Example: Creating a bug ticket with validation for Marriott API login issue");
    
    // In a real application, you would connect to the MCP server
    // const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    // const client = new McpClient();
    // await client.connect(transport);
    
    // Example 1: Incomplete bug ticket data (missing curl command and trace ID)
    const incompleteBugData = {
      summary: "API returns 500 error",
      description: "When accessing the API, it returns a 500 error.",
      priority: "Medium"
    };
    
    console.log("\nExample 1: Incomplete bug ticket data");
    console.log("Bug ticket data:", JSON.stringify(incompleteBugData, null, 2));
    
    console.log("\nTo create this bug using the MCP tool in Claude, use:");
    console.log(`
<use_mcp_tool>
<server_name>marriott-jira-mcp</server_name>
<tool_name>create_bug</tool_name>
<arguments>
${JSON.stringify(incompleteBugData, null, 2)}
</arguments>
</use_mcp_tool>
    `);
    
    console.log("\nExpected result (validation failure):");
    console.log(`
{
  "success": false,
  "message": "Bug ticket information is incomplete. Please use prepare_bug_ticket to validate the information first.",
  "validationResult": {
    "isComplete": false,
    "missingInformation": [
      {
        "field": "description",
        "message": "Please include steps to reproduce the issue in the description"
      },
      {
        "field": "description",
        "message": "Please include expected and actual behavior in the description"
      },
      {
        "field": "reproduction",
        "message": "Please provide either a curl command that reproduces the issue OR a trace ID/x-request-id"
      }
    ],
    "recommendations": [
      "Add numbered steps to reproduce the issue",
      "Clearly state what was expected to happen and what actually happened",
      "Add a curl command with proper headers and payload",
      "If curl is not possible, provide the trace ID from the logs"
    ]
  }
}
    `);
    
    // Example 2: Complete bug ticket data with curl command
    const completeBugDataWithCurl = {
      summary: "API returns 500 error when accessing /users endpoint",
      description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      priority: "High",
      curlCommand: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
    };
    
    console.log("\n\nExample 2: Complete bug ticket data with curl command");
    console.log("Bug ticket data:", JSON.stringify(completeBugDataWithCurl, null, 2));
    
    console.log("\nTo create this bug using the MCP tool in Claude, use:");
    console.log(`
<use_mcp_tool>
<server_name>marriott-jira-mcp</server_name>
<tool_name>create_bug</tool_name>
<arguments>
${JSON.stringify(completeBugDataWithCurl, null, 2)}
</arguments>
</use_mcp_tool>
    `);
    
    console.log("\nExpected result (success):");
    console.log(`
{
  "success": true,
  "key": "PROJECT-123",
  "id": "10001",
  "self": "https://your-domain.atlassian.net/rest/api/3/issue/10001",
  "message": "Bug ticket created successfully with key: PROJECT-123"
}
    `);
    
    // Example 3: Complete bug ticket data with trace ID
    const completeBugDataWithTraceId = {
      summary: "API returns 500 error when accessing /users endpoint",
      description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      priority: "High",
      traceId: "abc123-xyz-456"
    };
    
    console.log("\n\nExample 3: Complete bug ticket data with trace ID");
    console.log("Bug ticket data:", JSON.stringify(completeBugDataWithTraceId, null, 2));
    
    console.log("\nTo create this bug using the MCP tool in Claude, use:");
    console.log(`
<use_mcp_tool>
<server_name>marriott-jira-mcp</server_name>
<tool_name>create_bug</tool_name>
<arguments>
${JSON.stringify(completeBugDataWithTraceId, null, 2)}
</arguments>
</use_mcp_tool>
    `);
    
    console.log("\nExpected result (success):");
    console.log(`
{
  "success": true,
  "key": "PROJECT-124",
  "id": "10002",
  "self": "https://your-domain.atlassian.net/rest/api/3/issue/10002",
  "message": "Bug ticket created successfully with key: PROJECT-124"
}
    `);
    
    // Note about the required tags and workflow
    console.log("\n\nNote: The create_bug tool will automatically add the required tags:");
    console.log("- 'mcp'");
    console.log("- 'potential-issue'");
    console.log("\nThese tags will be added even if not specified in additionalLabels.");
    
    console.log("\nRecommended workflow:");
    console.log("1. Use prepare_bug_ticket to validate the bug ticket information");
    console.log("2. If validation fails, ask the user for the missing information");
    console.log("3. Once validation passes, use create_bug to create the bug ticket");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the function to see the output
createBugWithValidationExample();
