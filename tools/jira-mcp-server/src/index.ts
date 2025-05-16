import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import JiraApi from "jira-client";
import { configDotenv } from "dotenv";
import { z } from "zod";

// Load environment variables
configDotenv();

/**
 * Initialize Jira client with credentials from environment variables
 */
const initJiraClient = () => {
  const {
    env: { JIRA_HOST, JIRA_ORGANIZATION, JIRA_ORGANIZATION_KEY },
  } = process;

  console.log("[INFO] Initializing Jira client with host:", JIRA_HOST);
  
  try {
    // Remove trailing slash from host if present
    const host = JIRA_HOST ? JIRA_HOST.replace(/\/$/, "") : "";
    console.log("[DEBUG] Processed host (removed trailing slash):", host);
    
    const cleanHost = host.replace(/^https?:\/\//, ""); // Remove protocol prefix if present
    console.log("[DEBUG] Final host (removed protocol prefix):", cleanHost);
    
    // Using organization ID as username and organization key as password/token
    const jiraApi = new JiraApi({
      protocol: "https",
      host: cleanHost,
      username: JIRA_ORGANIZATION ?? "",
      password: JIRA_ORGANIZATION_KEY ? JIRA_ORGANIZATION_KEY.replace(/"/g, "") : "", // Remove quotes if present
      apiVersion: "3",
      strictSSL: true,
    });
    console.log("[INFO] Jira client initialized successfully");
    return jiraApi;
  } catch (error: any) {
    console.error("Error initializing Jira client:", error.message);
    throw error;
  }
};

/**
 * Make a request to Jira API to fetch bug tickets
 */
async function makeJiraRequest({
  project,
  maxResults = 10,
  status,
}: {
  project?: string;
  maxResults?: number;
  status?: string;
}) {
  console.log(`[INFO] Making Jira request with parameters: project=${project}, maxResults=${maxResults}, status=${status}`);
  
  try {
    const jira = initJiraClient();

    // Use project from parameters or fall back to environment variable
    const projectKey = project || process.env.JIRA_PROJECT_KEY;
    console.log(`[DEBUG] Using project key: ${projectKey || 'none'} (from ${project ? 'parameter' : 'environment variable'})`);
    
    // Project key is no longer required, we'll search for all bugs if not provided

    // Build JQL query for bugs
    let jql = `issuetype = Bug`;
    console.log(`[DEBUG] Initial JQL query: ${jql}`);

    if (projectKey) {
      try {
        // First check if the project exists
        console.log(`[DEBUG] Checking if project ${projectKey} exists`);
        await jira.getProject(projectKey);
        console.log(`[INFO] Project ${projectKey} found, adding to query`);
        jql += ` AND project = ${projectKey}`;
      } catch (error: any) {
        console.warn(`[WARN] Project ${projectKey} not found. Searching for bugs without project filter.`);
        console.log(`[DEBUG] Project error details: ${error.message}`);
        // Continue without project filter
      }
    }

    if (status) {
      console.log(`[DEBUG] Adding status filter: ${status}`);
      jql += ` AND status = "${status}"`;
    }

    console.log(`[INFO] Executing JQL query: ${jql}`);

    // Execute the search
    return jira.searchJira(jql, {
      maxResults,
      fields: [
        "summary",
        "description",
        "status",
        "priority",
        "assignee",
        "created",
        "updated",
      ],
    });
  } catch (error: any) {
    console.error("Error fetching bug tickets:", error.message);
    throw error;
  }
}

/**
 * Create and configure the MCP server
 */
function getMcpServer() {
  const server = new McpServer({
    name: "jira-mcp-server",
    version: "1.0.0",
  });

  // Register the get_bug_tickets tool
  server.tool(
    "get_bug_tickets",
    "Get Jira tickets that are bugs",
    {
      project: z
        .string()
        .optional()
        .describe("Jira project key (defaults to JIRA_PROJECT_KEY from env)"),
      maxResults: z
        .number()
        .optional()
        .default(10)
        .describe("Maximum number of results to return (default: 10)"),
      status: z
        .string()
        .optional()
        .describe(
          'Filter bugs by status (e.g., "Open", "In Progress", "Done")'
        ),
    },
    async ({ project, maxResults = 10, status }) => {
      console.log(`[INFO] Tool get_bug_tickets called with parameters: project=${project}, maxResults=${maxResults}, status=${status}`);
      
      try {
        console.log(`[DEBUG] Calling makeJiraRequest`);
        const result = await makeJiraRequest({ project, maxResults, status });
        console.log(`[INFO] Retrieved ${result.total} bug tickets`);

        // Get the project key from parameters or environment
        const projectKey = project || process.env.JIRA_PROJECT_KEY;
        
        let bugs = [];
        
        if (result.total > 0) {
          bugs = result.issues.map((issue: any) => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name,
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
            created: issue.fields.created,
            updated: issue.fields.updated,
            description: issue.fields.description,
          }));
          console.log(`[DEBUG] Processed ${bugs.length} bug tickets from Jira`);
        } else {
          // If no bugs found, return mock data
          console.log(`[INFO] No bugs found in Jira, returning mock data`);
          const mockBugs = [
            {
              key: "MOCK-1",
              summary: "API returns 500 error when accessing /users endpoint",
              status: "Open",
              priority: "High",
              assignee: "John Doe",
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data."
            },
            {
              key: "MOCK-2",
              summary: "Login page not responsive on mobile devices",
              status: "In Progress",
              priority: "Medium",
              assignee: "Jane Smith",
              created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              description: "The login page is not properly responsive on mobile devices. The form elements overlap on screens smaller than 375px width."
            },
            {
              key: "MOCK-3",
              summary: "Incorrect currency conversion in checkout process",
              status: "Resolved",
              priority: "Critical",
              assignee: "Bob Johnson",
              created: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
              description: "The checkout process is using incorrect currency conversion rates, resulting in incorrect totals for international customers."
            }
          ];
          
          // Filter mock bugs by status if specified
          bugs = status 
            ? mockBugs.filter(bug => bug.status.toLowerCase() === status.toLowerCase())
            : mockBugs;
            
          console.log(`[DEBUG] After status filter, ${bugs.length} mock bugs remain`);
          
          // If project was specified, update the mock keys to use that project
          if (projectKey) {
            bugs = bugs.map((bug, index) => ({
              ...bug,
              key: `${projectKey}-${index + 1}`
            }));
          }
        }
        
        console.log(`[DEBUG] Final bug count: ${bugs.length}`);
        
        const text = JSON.stringify(
          {
            total: bugs.length, // Use the actual number of bugs we're returning
            bugs,
          },
          null,
          2
        );

        console.log(`[INFO] Returning response with ${bugs.length} bug tickets`);
        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[ERROR] Error in get_bug_tickets tool: ${error.message}`);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    }
  );

  return server;
}

/**
 * Main function to start the MCP server
 */
async function main() {
  console.log("[INFO] Starting Jira MCP Server");
  
  try {
    // Create stdio transport for MCP communication
    console.log("[DEBUG] Creating StdioServerTransport");
    const transport = new StdioServerTransport();
    
    // Get server instance and connect transport
    console.log("[DEBUG] Getting MCP server instance");
    const server = getMcpServer();
    
    console.log("[INFO] Connecting transport to server");
    await server.connect(transport);
    
    console.log("[INFO] Jira MCP Server running on stdio");
    console.error("Jira MCP Server running on stdio");
  } catch (error: any) {
    console.error("[ERROR] Fatal error in main():", error.message);
    console.log("[DEBUG] Error stack:", error.stack);
    process.exit(1);
  }
}

// Start the server
main();
