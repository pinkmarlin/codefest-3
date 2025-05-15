# Jira MCP Server

An MCP (Model Context Protocol) server for accessing Jira tickets, specifically designed to pull bug tickets from Jira projects.

## Overview

This MCP server provides tools to interact with Jira's API, allowing you to:
- Fetch bug tickets from specified Jira projects
- Filter bugs by status
- Limit the number of results returned

## Installation

1. Clone this repository
2. Navigate to the jira-mcp-server directory
3. Install dependencies:

```bash
cd tools/jira-mcp-server
npm install
```

## Configuration

1. Copy the `.env.example` file to create a new `.env` file:

```bash
cp .env.example .env
```

2. Edit the `.env` file with your Jira credentials:

```
JIRA_HOST=https://your-domain.atlassian.net
JIRA_USERNAME=your-email@example.com
JIRA_API_TOKEN=your-api-token
JIRA_PROJECT_KEY=PROJECT
```

- **JIRA_HOST**: Your Jira instance URL
- **JIRA_USERNAME**: Your Jira username (usually your email)
- **JIRA_API_TOKEN**: Your Jira API token (can be generated in Atlassian account settings)
- **JIRA_PROJECT_KEY**: Default project key to use when not specified in queries

## Usage

Start the MCP server:

```bash
npm start
```

The server will start and be available for use with MCP-compatible clients.

## Available Tools

### get_bug_tickets

Retrieves Jira tickets that are classified as bugs.

**Parameters:**

- `project` (optional): Jira project key. If not provided, uses the JIRA_PROJECT_KEY from your .env file.
- `maxResults` (optional): Maximum number of results to return. Default is 10.
- `status` (optional): Filter bugs by status (e.g., "Open", "In Progress", "Done").

**Example Usage:**

```javascript
// Example of how to use with an MCP client
const result = await mcpClient.useTool('jira-server', 'get_bug_tickets', {
  project: 'PROJECT',
  maxResults: 20,
  status: 'Open'
});

console.log(`Found ${result.total} bug tickets`);
console.log(result.bugs);
```

**Response Format:**

```json
{
  "total": 5,
  "bugs": [
    {
      "key": "PROJECT-123",
      "summary": "Bug title",
      "status": "Open",
      "priority": "High",
      "assignee": "John Doe",
      "created": "2023-05-15T10:00:00.000Z",
      "updated": "2023-05-15T11:00:00.000Z",
      "description": "Bug description"
    },
    // More bugs...
  ]
}
```

## Error Handling

The server includes error handling for common issues:
- Invalid Jira credentials
- Network connectivity problems
- Invalid JQL queries

Errors will be logged to the console with descriptive messages.
