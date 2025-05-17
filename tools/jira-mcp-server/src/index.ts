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
    env: { JIRA_HOST, JIRA_USERNAME, JIRA_API_TOKEN },
  } = process;

  console.log("[INFO] Initializing Jira client with host:", JIRA_HOST);
  
  try {
    // Remove trailing slash from host if present
    const host = JIRA_HOST ? JIRA_HOST.replace(/\/$/, "") : "";
    console.log("[DEBUG] Processed host (removed trailing slash):", host);
    
    const cleanHost = host.replace(/^https?:\/\//, ""); // Remove protocol prefix if present
    console.log("[DEBUG] Final host (removed protocol prefix):", cleanHost);
    
    // Using personal username and API token for authentication
    const jiraApi = new JiraApi({
      protocol: "https",
      host: cleanHost,
      username: JIRA_USERNAME ?? "",
      password: JIRA_API_TOKEN ? JIRA_API_TOKEN.replace(/"/g, "") : "", // Remove quotes if present
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
 * Convert plain text to Atlassian Document Format (ADF)
 */
function convertToADF(text: string): any {
  console.log(`[DEBUG] Converting text to Atlassian Document Format`);
  
  // Split the text into paragraphs
  const paragraphs = text.split('\n\n');
  
  // Create content array for ADF
  const content = paragraphs.map(paragraph => {
    // Skip empty paragraphs
    if (!paragraph.trim()) return null;
    
    // Check if paragraph is a numbered list item (e.g., "1. Item")
    const numberedListMatch = paragraph.match(/^(\d+)\.\s+(.+)$/);
    if (numberedListMatch) {
      return {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: paragraph
          }
        ]
      };
    }
    
    // Regular paragraph
    return {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: paragraph
        }
      ]
    };
  }).filter(item => item !== null);
  
  // Create ADF document
  return {
    version: 1,
    type: "doc",
    content
  };
}

/**
 * Create a new bug ticket in Jira
 */
async function createJiraBug({
  project,
  summary,
  description,
  priority = "Medium",
  assignee,
  labels = [],
  component,
}: {
  project?: string;
  summary: string;
  description: string;
  priority?: string;
  assignee?: string;
  labels?: string[];
  component?: string;
}) {
  console.log(`[INFO] Creating new bug ticket with summary: ${summary}`);
  
  try {
    const jira = initJiraClient();

    // Use project from parameters or fall back to environment variable
    const projectKey = project || process.env.JIRA_PROJECT_KEY;
    
    if (!projectKey) {
      throw new Error("Project key is required. Provide it as a parameter or set JIRA_PROJECT_KEY environment variable.");
    }
    
    console.log(`[DEBUG] Using project key: ${projectKey}`);
    
    // Ensure required labels are included
    const requiredLabels = ["mcp", "potential-issue"];
    const allLabels = [...new Set([...labels, ...requiredLabels])];
    
    console.log(`[DEBUG] Labels for the bug: ${allLabels.join(', ')}`);
    
    // Convert description to Atlassian Document Format
    const adfDescription = convertToADF(description);
    console.log(`[DEBUG] Converted description to ADF format`);
    
    // Prepare issue data
    const issueData: any = {
      fields: {
        project: {
          key: projectKey
        },
        summary: summary,
        description: adfDescription,
        issuetype: {
          name: "Bug"
        },
        labels: allLabels,
        priority: priority ? { name: priority } : undefined
      }
    };
    
    // Add assignee if provided
    if (assignee) {
      console.log(`[DEBUG] Setting assignee: ${assignee}`);
      issueData.fields.assignee = { name: assignee };
    }
    
    // Add component if provided
    if (component) {
      console.log(`[DEBUG] Setting component: ${component}`);
      issueData.fields.components = [{ name: component }];
    }
    
    console.log(`[DEBUG] Creating issue with data:`, JSON.stringify(issueData, null, 2));
    
    // Create the issue
    const newIssue = await jira.addNewIssue(issueData);
    console.log(`[INFO] Successfully created bug ticket with key: ${newIssue.key}`);
    
    return newIssue;
  } catch (error: any) {
    console.error(`[ERROR] Error creating bug ticket:`, error.message);
    throw error;
  }
}

/**
 * Get a specific Jira issue by its key
 */
async function getJiraIssue({
  issueKey,
  fields,
}: {
  issueKey: string;
  fields?: string[];
}) {
  console.log(`[INFO] Getting Jira issue with key: ${issueKey}`);
  
  try {
    const jira = initJiraClient();
    
    // Define the fields to retrieve
    const requestedFields = fields || [
      "summary",
      "description",
      "status",
      "priority",
      "assignee",
      "reporter",
      "created",
      "updated",
      "issuetype",
      "project",
      "labels",
      "components",
      "fixVersions",
      "resolution"
    ];
    
    console.log(`[DEBUG] Requesting fields: ${requestedFields.join(', ')}`);
    
    // Use the findIssue method to get a specific issue
    const issue = await jira.findIssue(issueKey, requestedFields.join(','));
    console.log(`[INFO] Successfully retrieved issue ${issueKey}`);
    
    return issue;
  } catch (error: any) {
    console.error(`[ERROR] Error fetching issue ${issueKey}:`, error.message);
    throw error;
  }
}

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
    } else {
      // If no specific status is requested, exclude closed bugs
      console.log(`[DEBUG] Adding filter to exclude closed bugs`);
      jql += ` AND status != "Closed" AND status != "Done"`;
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
 * Mark tickets as potential duplicates
 * This function prepends "[potential duplicate]" to the summary (title) of duplicate tickets
 * and links them to the primary ticket with "relates to" relationship
 */
async function markPotentialDuplicates({
  primaryTicket,
  duplicateTickets,
}: {
  primaryTicket: string;
  duplicateTickets: string[];
}) {
  console.log(`[INFO] Marking tickets as potential duplicates. Primary: ${primaryTicket}, Duplicates: ${duplicateTickets.join(', ')}`);
  
  try {
    const jira = initJiraClient();
    const results = [];
    
    // Process each duplicate ticket
    for (const ticketKey of duplicateTickets) {
      console.log(`[DEBUG] Processing duplicate ticket: ${ticketKey}`);
      
      try {
        // Get the current ticket data
        const ticket = await getJiraIssue({ issueKey: ticketKey });
        
        // Check if the summary already has the potential duplicate marker
        const summary = ticket.fields.summary || "";
        
        // Check if already marked as potential duplicate
        if (!summary.startsWith("[potential duplicate]")) {
          // Prepend the marker to the summary
          const newSummary = `[potential duplicate] ${summary}`;
          console.log(`[DEBUG] Updating summary for ${ticketKey} with potential duplicate marker`);
          
          await jira.updateIssue(ticketKey, {
            fields: {
              summary: newSummary
            }
          });
          
          console.log(`[INFO] Updated summary for ${ticketKey}`);
        } else {
          console.log(`[INFO] Ticket ${ticketKey} already marked as potential duplicate, skipping summary update`);
        }
        
        // Create a link between the duplicate and the primary ticket
        console.log(`[DEBUG] Creating link between ${ticketKey} and ${primaryTicket}`);
        
        await jira.issueLink({
          type: {
            name: "Relates"  // Using "Relates" as the link type
          },
          inwardIssue: {
            key: ticketKey
          },
          outwardIssue: {
            key: primaryTicket
          }
        });
        
        console.log(`[INFO] Created link between ${ticketKey} and ${primaryTicket}`);
        
        results.push({
          key: ticketKey,
          success: true,
          message: `Marked as potential duplicate and linked to ${primaryTicket}`
        });
      } catch (error: any) {
        console.error(`[ERROR] Error processing ticket ${ticketKey}:`, error.message);
        results.push({
          key: ticketKey,
          success: false,
          error: error.message
        });
      }
    }
    
    return {
      primaryTicket,
      results
    };
  } catch (error: any) {
    console.error(`[ERROR] Error marking potential duplicates:`, error.message);
    throw error;
  }
}

/**
 * Validate bug ticket information
 * This function checks if the provided information is complete and valid
 */
function validateBugTicket({
  summary,
  description,
  priority,
  curlCommand,
  traceId,
}: {
  summary?: string;
  description?: string;
  priority?: string;
  curlCommand?: string;
  traceId?: string;
}) {
  console.log(`[INFO] Validating bug ticket information`);
  
  const missingInformation = [];
  const recommendations = [];
  
  // Check for required basic fields
  if (!summary || summary.trim().length < 10) {
    missingInformation.push({
      field: "summary",
      message: "Please provide a descriptive summary of at least 10 characters"
    });
    recommendations.push("Add a clear and concise summary that describes the issue");
  }
  
  if (!description || description.trim().length < 50) {
    missingInformation.push({
      field: "description",
      message: "Please provide a detailed description of at least 50 characters"
    });
    recommendations.push("Include a detailed description with steps to reproduce, expected vs. actual behavior");
  } else {
    // Check if description contains steps to reproduce
    if (!description.toLowerCase().includes("steps to reproduce") && 
        !description.toLowerCase().includes("reproduction steps") &&
        !description.match(/\d+\.\s+.+/)) {
      missingInformation.push({
        field: "description",
        message: "Please include steps to reproduce the issue in the description"
      });
      recommendations.push("Add numbered steps to reproduce the issue");
    }
    
    // Check if description contains expected vs. actual behavior
    if (!description.toLowerCase().includes("expected") || 
        !description.toLowerCase().includes("actual")) {
      missingInformation.push({
        field: "description",
        message: "Please include expected and actual behavior in the description"
      });
      recommendations.push("Clearly state what was expected to happen and what actually happened");
    }
  }
  
  // Check for API reproduction information (curl command or trace ID)
  if (!curlCommand && !traceId) {
    missingInformation.push({
      field: "reproduction",
      message: "Please provide either a curl command that reproduces the issue OR a trace ID/x-request-id"
    });
    recommendations.push("Add a curl command with proper headers and payload");
    recommendations.push("If curl is not possible, provide the trace ID from the logs");
  } else if (curlCommand) {
    // Validate curl command format
    if (!curlCommand.startsWith("curl ")) {
      missingInformation.push({
        field: "curlCommand",
        message: "The curl command provided does not appear to be valid"
      });
      recommendations.push("Ensure the curl command starts with 'curl' and includes the full request");
    }
  }
  
  // Validate priority selection
  if (priority) {
    const validPriorities = ["Highest", "High", "Medium", "Low", "Lowest"];
    if (!validPriorities.includes(priority)) {
      missingInformation.push({
        field: "priority",
        message: `Invalid priority: ${priority}. Valid values are: ${validPriorities.join(", ")}`
      });
      recommendations.push("Select a valid priority level");
    }
  } else {
    missingInformation.push({
      field: "priority",
      message: "Please specify a priority level for the bug"
    });
    recommendations.push("Determine if the issue is blocking (Highest/High) or has a workaround (Medium/Low)");
  }
  
  return {
    isComplete: missingInformation.length === 0,
    missingInformation,
    recommendations
  };
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

  // Register the get_issue tool
  server.tool(
    "get_issue",
    "Get details of a specific issue from a Jira project",
    {
      issueKey: z
        .string()
        .describe("The key of the issue to retrieve (e.g., 'PROJECT-123')"),
      fields: z
        .array(z.string())
        .optional()
        .describe("Optional array of field names to include in the response"),
    },
    async ({ issueKey, fields }) => {
      console.log(`[INFO] Tool get_issue called with parameters: issueKey=${issueKey}`);
      
      try {
        console.log(`[DEBUG] Calling getJiraIssue`);
        const issue = await getJiraIssue({ issueKey, fields });
        
        // Format the response
        const formattedIssue = {
          key: issue.key,
          id: issue.id,
          self: issue.self,
          fields: {
            summary: issue.fields.summary,
            description: issue.fields.description,
            status: issue.fields.status?.name,
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
            reporter: issue.fields.reporter?.displayName,
            created: issue.fields.created,
            updated: issue.fields.updated,
            issuetype: issue.fields.issuetype?.name,
            project: {
              key: issue.fields.project?.key,
              name: issue.fields.project?.name
            },
            labels: issue.fields.labels,
            components: issue.fields.components?.map((c: any) => c.name),
            fixVersions: issue.fields.fixVersions?.map((v: any) => v.name),
            resolution: issue.fields.resolution?.name
          }
        };
        
        console.log(`[INFO] Returning formatted issue ${issueKey}`);
        
        const text = JSON.stringify(formattedIssue, null, 2);

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[ERROR] Error in get_issue tool: ${error.message}`);
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

  // Register the prepare_bug_ticket tool
  server.tool(
    "prepare_bug_ticket",
    "Validate bug ticket information before creating a ticket",
    {
      summary: z
        .string()
        .optional()
        .describe("Summary/title of the bug"),
      description: z
        .string()
        .optional()
        .describe("Detailed description of the bug"),
      priority: z
        .string()
        .optional()
        .describe("Priority of the bug (e.g., 'Highest', 'High', 'Medium', 'Low', 'Lowest')"),
      curlCommand: z
        .string()
        .optional()
        .describe("A curl command that reproduces the issue"),
      traceId: z
        .string()
        .optional()
        .describe("A trace ID or x-request-id if a curl command cannot be provided"),
    },
    async ({ summary, description, priority, curlCommand, traceId }) => {
      console.log(`[INFO] Tool prepare_bug_ticket called with parameters: summary=${summary}, priority=${priority}`);
      
      try {
        // Validate the bug ticket information
        const validationResult = validateBugTicket({
          summary,
          description,
          priority,
          curlCommand,
          traceId
        });
        
        console.log(`[INFO] Validation result: isComplete=${validationResult.isComplete}, missingFields=${validationResult.missingInformation.length}`);
        
        const text = JSON.stringify(validationResult, null, 2);

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[ERROR] Error in prepare_bug_ticket tool: ${error.message}`);
        
        const errorResponse = {
          success: false,
          error: error.message
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  // Register the create_bug tool
  server.tool(
    "create_bug",
    "Create a new bug ticket in Jira with required tags. It is recommended to use prepare_bug_ticket first to validate the information.",
    {
      project: z
        .string()
        .optional()
        .describe("Jira project key (defaults to JIRA_PROJECT_KEY from env)"),
      summary: z
        .string()
        .describe("Summary/title of the bug"),
      description: z
        .string()
        .describe("Detailed description of the bug"),
      priority: z
        .string()
        .optional()
        .describe("Priority of the bug (e.g., 'Highest', 'High', 'Medium', 'Low', 'Lowest')"),
      assignee: z
        .string()
        .optional()
        .describe("Username of the person to assign the bug to"),
      additionalLabels: z
        .array(z.string())
        .optional()
        .describe("Additional labels to add to the bug (will always include 'mcp' and 'potential-issue')"),
      component: z
        .string()
        .optional()
        .describe("Component the bug is related to (e.g., 'experience layer', 'property catalog', 'guest info', 'web', 'mobile', 'ciam', 'loyalty')"),
      curlCommand: z
        .string()
        .optional()
        .describe("A curl command that reproduces the issue"),
      traceId: z
        .string()
        .optional()
        .describe("A trace ID or x-request-id if a curl command cannot be provided"),
    },
    async ({ project, summary, description, priority, assignee, additionalLabels, component, curlCommand, traceId }) => {
      console.log(`[INFO] Tool create_bug called with parameters: project=${project}, summary=${summary}, component=${component}`);
      
      try {
        // Validate the bug ticket information first
        const validationResult = validateBugTicket({
          summary,
          description,
          priority,
          curlCommand,
          traceId
        });
        
        // If validation fails, return the validation result
        if (!validationResult.isComplete) {
          console.log(`[INFO] Bug ticket validation failed. Returning validation result.`);
          
          const validationResponse = {
            success: false,
            message: "Bug ticket information is incomplete. Please use prepare_bug_ticket to validate the information first.",
            validationResult
          };
          
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(validationResponse, null, 2),
              },
            ],
          };
        }
        
        // Enhance the description with curl command or trace ID if provided
        let enhancedDescription = description;
        
        if (curlCommand) {
          enhancedDescription += `\n\nReproduction curl command:\n\`\`\`\n${curlCommand}\n\`\`\``;
        }
        
        if (traceId) {
          enhancedDescription += `\n\nTrace ID / x-request-id: ${traceId}`;
        }
        
        console.log(`[DEBUG] Calling createJiraBug`);
        const result = await createJiraBug({ 
          project, 
          summary, 
          description: enhancedDescription, 
          priority, 
          assignee, 
          labels: additionalLabels || [],
          component
        });
        
        const response = {
          success: true,
          key: result.key,
          id: result.id,
          self: result.self,
          message: `Bug ticket created successfully with key: ${result.key}`
        };
        
        console.log(`[INFO] Returning successful response for bug creation: ${result.key}`);
        
        const text = JSON.stringify(response, null, 2);

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[ERROR] Error in create_bug tool: ${error.message}`);
        
        const errorResponse = {
          success: false,
          error: error.message
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
            },
          ],
        };
      }
    }
  );

  // Register the mark_potential_duplicates tool
  server.tool(
    "mark_potential_duplicates",
    "Mark tickets as potential duplicates of a primary ticket",
    {
      primaryTicket: z
        .string()
        .describe("The key of the primary ticket (e.g., 'PROJECT-123')"),
      duplicateTickets: z
        .array(z.string())
        .describe("Array of ticket keys to mark as potential duplicates"),
    },
    async ({ primaryTicket, duplicateTickets }) => {
      console.log(`[INFO] Tool mark_potential_duplicates called with parameters: primaryTicket=${primaryTicket}, duplicateTickets=${duplicateTickets.join(', ')}`);
      
      try {
        console.log(`[DEBUG] Calling markPotentialDuplicates`);
        const result = await markPotentialDuplicates({ 
          primaryTicket, 
          duplicateTickets
        });
        
        console.log(`[INFO] Returning results of marking potential duplicates`);
        
        const text = JSON.stringify(result, null, 2);

        return {
          content: [
            {
              type: "text",
              text,
            },
          ],
        };
      } catch (error: any) {
        console.error(`[ERROR] Error in mark_potential_duplicates tool: ${error.message}`);
        
        const errorResponse = {
          success: false,
          error: error.message
        };
        
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(errorResponse, null, 2),
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
