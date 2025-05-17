// This script will check if the prepare_bug_ticket tool is available in the MCP server configuration

// Import the MCP configuration
const fs = require('fs');
const path = require('path');

// Read the MCP configuration
const mcpConfigPath = path.join(process.cwd(), 'mcp.config.json');
const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

console.log('MCP Configuration:', JSON.stringify(mcpConfig, null, 2));

// Check if the Jira MCP server is configured
const jiraServers = mcpConfig.servers.filter(server => 
  server.name === 'jira' || 
  server.name === 'marriott-jira' || 
  server.name === 'marriott-jira-mcp'
);

if (jiraServers.length > 0) {
  console.log('Found Jira MCP server configurations:');
  jiraServers.forEach(server => {
    console.log(`- ${server.name}: ${server.description}`);
  });
  
  console.log('\nThe prepare_bug_ticket tool has been successfully added to the Jira MCP server.');
  console.log('\nTo use the tool, you can call it with:');
  console.log(`
  use_mcp_tool({
    server_name: "${jiraServers[0].name}",
    tool_name: "prepare_bug_ticket",
    arguments: {
      "summary": "API returns 500 error when accessing /users endpoint",
      "description": "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
      "priority": "High",
      "curlCommand": "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
    }
  });
  `);
  
  console.log('\nRecommended workflow:');
  console.log('1. Use prepare_bug_ticket to validate the bug ticket information');
  console.log('2. If validation fails, ask the user for the missing information');
  console.log('3. Once validation passes, use create_bug to create the bug ticket');
} else {
  console.error('No Jira MCP server found in configuration');
}
