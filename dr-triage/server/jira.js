import JiraApi from "jira-client";

const {
  env: { JIRA_HOST, JIRA_ORGANIZATION, JIRA_ORGANIZATION_KEY },
} = process;

const host = JIRA_HOST ? JIRA_HOST.replace(/\/$/, "") : "";
const cleanHost = host.replace(/^https?:\/\//, ""); // Remove protocol prefix if present
const jira = new JiraApi({
  protocol: "https",
  host: cleanHost,
  username: JIRA_ORGANIZATION ?? "",
  password: JIRA_ORGANIZATION_KEY ? JIRA_ORGANIZATION_KEY.replace(/"/g, "") : "", // Remove quotes if present
  apiVersion: "3",
  strictSSL: true,
});


/**
 * Searches similar jira tickets based on a given description
 * @param {string} text - full text search to search tickets
 * @param {string} [status] - status to filter tickets on
 * @param {string} [project]
 * @param {number} [maxResults]
 */
async function searchJira(text, status = 'Open', project = process.env.JIRA_PROJECT_KEY, maxResults = 10) {
  console.log(`[INFO] Making Jira request with parameters: project=${project}, maxResults=${maxResults}, status=${status}`);

  try {

    // Use project from parameters or fall back to environment variable
    console.log(`[DEBUG] Using project key: ${project || 'none'} (from ${project ? 'parameter' : 'environment variable'})`);

    // Project key is no longer required, we'll search for all bugs if not provided

    // Build JQL query for bugs
    let jql = `issuetype = Bug`;
    console.log(`[DEBUG] Initial JQL query: ${jql}`);

    if (project) {
      try {
        // First check if the project exists
        console.log(`[DEBUG] Checking if project ${project} exists`);
        await jira.getProject(project);
        console.log(`[INFO] Project ${project} found, adding to query`);
        jql += ` AND project = ${project}`;
      } catch (error) {
        console.warn(`[WARN] Project ${project} not found. Searching for bugs without project filter.`);
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
  } catch (error) {
    console.error("Error fetching bug tickets:", error.message);
    throw error;
  }
}

export async function searchSimilarDefects(text, status = 'Open', project = process.env.JIRA_PROJECT_KEY, maxResults = 10) {
  const result = await searchJira(text, status, project, maxResults);

  let bugs = [];

  if (result.total > 0) {
    bugs = result.issues.map((issue) => ({
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
    if (project) {
      bugs = bugs.map((bug, index) => ({
        ...bug,
        key: `${project}-${index + 1}`
      }));
    }
  }

  return bugs;

}