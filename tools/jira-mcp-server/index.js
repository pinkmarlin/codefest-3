const { MCPServer, MCPTool } = require('@modelcontextprotocol/server');
const JiraClient = require('jira-client');
require('dotenv').config();

// Initialize Jira client
const initJiraClient = () => {
  try {
    return new JiraClient({
      protocol: 'https',
      host: process.env.JIRA_HOST.replace('https://', ''),
      username: process.env.JIRA_USERNAME,
      password: process.env.JIRA_API_TOKEN,
      apiVersion: '3',
      strictSSL: true
    });
  } catch (error) {
    console.error('Error initializing Jira client:', error.message);
    throw error;
  }
};

// Create MCP server
const server = new MCPServer({
  name: 'jira-server',
  description: 'MCP server for accessing Jira tickets'
});

// Define tool for getting bug tickets
const getBugTicketsTool = new MCPTool({
  name: 'get_bug_tickets',
  description: 'Get Jira tickets that are bugs',
  inputSchema: {
    type: 'object',
    properties: {
      project: {
        type: 'string',
        description: 'Jira project key (defaults to JIRA_PROJECT_KEY from env)'
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 10)'
      },
      status: {
        type: 'string',
        description: 'Filter bugs by status (e.g., "Open", "In Progress", "Done")'
      }
    },
    additionalProperties: false
  },
  execute: async ({ project, maxResults = 10, status }) => {
    try {
      const jira = initJiraClient();
      
      // Build JQL query
      const projectKey = project || process.env.JIRA_PROJECT_KEY;
      let jql = `issuetype = Bug`;
      
      if (projectKey) {
        jql += ` AND project = ${projectKey}`;
      }
      
      if (status) {
        jql += ` AND status = "${status}"`;
      }
      
      // Search for issues
      const result = await jira.searchJira(jql, {
        maxResults,
        fields: ['summary', 'description', 'status', 'priority', 'assignee', 'created', 'updated']
      });
      
      // Format the results
      return {
        total: result.total,
        bugs: result.issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name,
          priority: issue.fields.priority?.name,
          assignee: issue.fields.assignee?.displayName,
          created: issue.fields.created,
          updated: issue.fields.updated,
          description: issue.fields.description
        }))
      };
    } catch (error) {
      console.error('Error fetching bug tickets:', error.message);
      throw error;
    }
  }
});

// Add tool to server
server.addTool(getBugTicketsTool);

// Start server
server.start().then(() => {
  console.log('Jira MCP server started');
  console.log('Available tools:');
  console.log('- get_bug_tickets: Get Jira tickets that are bugs');
}).catch(error => {
  console.error('Failed to start Jira MCP server:', error.message);
});
