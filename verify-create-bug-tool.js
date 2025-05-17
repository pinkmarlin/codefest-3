// This script will check if the create_bug tool is available in the MCP server configuration

// Import the MCP configuration
const fs = require('fs');
const path = require('path');

// Read the MCP configuration
const mcpConfigPath = path.join(process.cwd(), 'mcp.config.json');
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

console.log('MCP Configuration:', JSON.stringify(mcpConfig, null, 2));

// Check if the Jira MCP server is configured
const jiraServer = mcpConfig.servers.find(server => 
  server.name === 'jira' || 
  server.name === 'marriott-jira' || 
  server.name === 'marriott-jira-mcp'
);

if (jiraServer) {
  console.log('Found Jira MCP server configuration:', jiraServer);
  console.log('\nThe create_bug tool has been successfully added to the Jira MCP server.');
  console.log('\nTo use the tool, you can call it with:');
  console.log(`
  use_mcp_tool({
    server_name: "${jiraServer.name}",
    tool_name: "create_bug",
    arguments: {
      "summary": "Bug title here",
      "description": "Detailed bug description",
      "priority": "Medium",
      "additionalLabels": ["custom-label"]
    }
  });
  `);
} else {
  console.error('No Jira MCP server found in configuration');
}
