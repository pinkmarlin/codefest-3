/**
 * Example script showing how to use the mark_potential_duplicates tool
 * 
 * This script demonstrates how to mark tickets as potential duplicates using the Jira MCP server.
 * Note: This is an example and won't actually run without proper setup.
 */

// Import required modules (in a real application)
// const { McpClient } = require("@modelcontextprotocol/sdk/client/mcp");
// const { ChildProcessTransport } = require("@modelcontextprotocol/sdk/client/child-process");

async function markPotentialDuplicatesExample() {
  try {
    console.log("Example: Marking tickets as potential duplicates of a primary ticket");
    
    // In a real application, you would connect to the MCP server
    // const transport = new ChildProcessTransport("node tools/jira-mcp-server/build/index.js");
    // const client = new McpClient();
    // await client.connect(transport);
    
    // Example data for marking potential duplicates
    const duplicateData = {
      primaryTicket: "MAPI-89", // The main ticket that others are duplicates of
      duplicateTickets: ["MAPI-93", "MAPI-96", "MAPI-103"] // Tickets to mark as potential duplicates
    };
    
    console.log("Marking potential duplicates data:", JSON.stringify(duplicateData, null, 2));
    
    // In a real application, you would call the mark_potential_duplicates tool
    // const result = await client.useTool("mark_potential_duplicates", duplicateData);
    // console.log("Tickets marked as potential duplicates:", result);
    
    console.log("\nTo mark these tickets as potential duplicates using the MCP tool in Claude, use:");
    console.log(`
<use_mcp_tool>
<server_name>marriott-jira-mcp</server_name>
<tool_name>mark_potential_duplicates</tool_name>
<arguments>
${JSON.stringify(duplicateData, null, 2)}
</arguments>
</use_mcp_tool>
    `);
    
    // Note about what the tool does
    console.log("\nThis tool will:");
    console.log("1. Prepend '[potential duplicate]' to the summary (title) of each duplicate ticket");
    console.log("2. Create a 'relates to' link between each duplicate ticket and the primary ticket");
    console.log("\nThis helps keep track of related issues and reduces duplicate work.");
    
  } catch (error) {
    console.error("Error:", error);
  }
}

// Execute the function to see the output
markPotentialDuplicatesExample();
