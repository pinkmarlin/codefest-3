/**
 * Example script showing how to use the create_bug tool
 * 
 * This script demonstrates how to create a bug ticket using the Jira MCP server.
 * Note: This is an example and won't actually run without proper setup.
 */

// Import required modules (in a real application)
// const { McpClient } = require("@modelcontextprotocol/sdk/client/mcp");
// const { ChildProcessTransport } = require("@modelcontextprotocol/sdk/client/child-process");

async function createBugExample() {
  try {
    console.log("Example: Creating a bug ticket for Marriott API login issue");
    
    // In a real application, you would connect to the MCP server
    // const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    // const client = new McpClient();
    // await client.connect(transport);
    
    // Example bug ticket data
    // Note: When determining priority, ask the user if the issue is blocking all development
    // or if they have a workaround available, then set the appropriate priority:
    // - "Highest"/"Critical": Blocking all development/production with no workaround
    // - "High": Significant impact with no reasonable workaround
    // - "Medium": Important issue with a viable workaround
    // - "Low": Minor issue that doesn't significantly impact functionality
    // - "Lowest": Cosmetic or enhancement request
    const bugData = {
      summary: "Unable to view favorite hotels in Marriott API",
      description: "Users are experiencing issues when attempting to view their favorite hotels. The favorites section either doesn't load or displays incorrectly.\n\nSteps to reproduce:\n1. Login to the Marriott app/website\n2. Navigate to the 'Favorites' or 'Saved Hotels' section\n3. Wait for the content to load\n\nExpected: User should see a list of their favorite/saved hotels\nActual: The favorites section either doesn't load, shows an error, or displays incorrectly",
      priority: "Medium", // Medium priority because there's a workaround (users can call customer service)
      additionalLabels: ["ui", "favorites", "api-access"],
      component: "web"
    };
    
    console.log("Bug ticket data:", JSON.stringify(bugData, null, 2));
    
    // In a real application, you would call the create_bug tool
    // const result = await client.useTool("create_bug", bugData);
    // console.log("Bug created successfully:", result);
    
    console.log("\nTo create this bug using the MCP tool in Claude, use:");
    console.log(`
<use_mcp_tool>
<server_name>jira</server_name>
<tool_name>create_bug</tool_name>
<arguments>
${JSON.stringify(bugData, null, 2)}
</arguments>
</use_mcp_tool>
    `);
    
    // Note about the required tags
    console.log("\nNote: The create_bug tool will automatically add the required tags:");
    console.log("- 'mcp'");
    console.log("- 'potential-issue'");
    console.log("\nThese tags will be added even if not specified in additionalLabels.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the function to see the output
createBugExample();
