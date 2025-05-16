import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import JiraApi from "jira-client";
import { configDotenv } from "dotenv";
import express from "express";

import { z } from "zod";

configDotenv();

const initJiraClient = () => {
  const {
    env: { JIRA_HOST, JIRA_USERNAME, JIRA_API_TOKEN },
  } = process;

  try {
    return new JiraApi({
      protocol: "https",
      host: JIRA_HOST ?? "",
      username: JIRA_USERNAME ?? "",
      password: JIRA_API_TOKEN ?? "",
      apiVersion: "3",
      strictSSL: true,
    });
  } catch (error: any) {
    console.error("Error initializing Jira client:", error.message);
    throw error;
  }
};

async function makeJiraRequest<T>({
  project,
  maxResults = 10,
  status,
}: {
  project: string;
  maxResults: number;
  status: string;
}) {
  try {
    const jira = initJiraClient();

    const projectKey = project || process.env.JIRA_PROJECT_KEY;

    let jql = `issuetype = Bug`;

    if (projectKey) {
      jql += ` AND project = ${projectKey}`;
    }

    if (status) {
      jql += ` AND status = "${status}"`;
    }

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

function getMcpServer() {
  const server = new McpServer({
    name: "jira-mcp-server",
    version: "1.0.0",
  });

  server.tool(
    "get_bug_tickets",
    "Get Jira tickets that are bugs",
    {
      project: z
        .string()
        .describe("Jira project key (defaults to JIRA_PROJECT_KEY from env)"),
      maxResults: z
        .number()
        .describe("Maximum number of results to return (default: 10)"),
      status: z
        .string()
        .describe(
          'Filter bugs by status (e.g., "Open", "In Progress", "Done")'
        ),
    },
    async ({ project, maxResults = 10, status }) => {
      const result = await makeJiraRequest({ project, maxResults, status });

      const text = JSON.stringify(
        {
          total: result.total,
          bugs: result.issues.map((issue: any) => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name,
            priority: issue.fields.priority?.name,
            assignee: issue.fields.assignee?.displayName,
            created: issue.fields.created,
            updated: issue.fields.updated,
            description: issue.fields.description,
          })),
        },
        null,
        2
      );

      return {
        content: [
          {
            type: "text",
            text,
          },
        ],
      };
    }
  );

  return server;
}

const app = express();

let transport: any;

app.get("/jira", async (req, res) => {
  transport = new SSEServerTransport("/tickets", res);
  await getMcpServer().connect(transport);
});

app.post("/tickets", async (req, res) => {
  await transport.handlePostMessage(req, res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`MCP Jira Server is running on http://localhost:${port}/jira`);
});
