# Jira MCP Server

An MCP (Model Context Protocol) server for accessing Jira tickets, specifically designed to pull bug tickets from Jira projects.

## Overview

This MCP server provides tools to interact with Jira's API, allowing you to:
- Fetch bug tickets from specified Jira projects
- Create new bug tickets with required tags ("mcp" and "potential-issue")
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

### Standard Usage

Start the MCP server:

```bash
npm start
```

The server will start and be available for use with MCP-compatible clients.

### Docker Usage

This project includes Docker support for easy deployment and consistent environments. The Docker setup is configured to use the `linux/amd64` platform for maximum compatibility.

#### Using Docker Directly

1. Build the Docker image:

```bash
cd tools/jira-mcp-server
docker build --platform linux/amd64 -t jira-mcp-server .
```

2. Run the container:

```bash
docker run -p 3000:3000 --env-file .env jira-mcp-server
```

#### Using Docker Compose

1. Start the service:

```bash
cd tools/jira-mcp-server
docker-compose up
```

2. To run in detached mode:

```bash
docker-compose up -d
```

3. To stop the service:

```bash
docker-compose down
```

#### Using the Helper Script

A helper script is provided to simplify Docker operations:

1. Make the script executable (if not already):

```bash
chmod +x docker-run.sh
```

2. Use the script with one of the following commands:

```bash
./docker-run.sh build      # Build the Docker image
./docker-run.sh run        # Run the Docker container
./docker-run.sh start      # Build and run the Docker container
./docker-run.sh compose    # Run using docker-compose
./docker-run.sh compose-d  # Run using docker-compose in detached mode
./docker-run.sh stop       # Stop the running container
./docker-run.sh help       # Show help message
```

The script will automatically check for a valid .env file before running.

## Available Tools

### prepare_bug_ticket

Validates bug ticket information before creating a ticket. This tool checks if the provided information is complete and valid, ensuring that all necessary details are included before creating a bug ticket.

**Parameters:**

- `summary` (optional): Summary/title of the bug.
- `description` (optional): Detailed description of the bug.
- `priority` (optional): Priority of the bug (e.g., "Highest", "High", "Medium", "Low", "Lowest").
- `curlCommand` (optional): A curl command that reproduces the issue.
- `traceId` (optional): A trace ID or x-request-id if a curl command cannot be provided.

**Example Usage:**

```javascript
// Example of how to use with an MCP client
const result = await mcpClient.useTool('jira-server', 'prepare_bug_ticket', {
  summary: "API returns 500 error when accessing /users endpoint",
  description: "When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error",
  priority: "High",
  curlCommand: "curl -X GET https://api.example.com/users -H 'Authorization: Bearer token123'"
});

console.log(`Validation result: ${result.isComplete ? 'Complete' : 'Incomplete'}`);
console.log(result);
```

**Response Format:**

```json
{
  "isComplete": true,
  "missingInformation": [],
  "recommendations": []
}
```

If the information is incomplete:

```json
{
  "isComplete": false,
  "missingInformation": [
    {
      "field": "description",
      "message": "Please include steps to reproduce the issue in the description"
    },
    {
      "field": "reproduction",
      "message": "Please provide either a curl command that reproduces the issue OR a trace ID/x-request-id"
    }
  ],
  "recommendations": [
    "Add numbered steps to reproduce the issue",
    "Add a curl command with proper headers and payload",
    "If curl is not possible, provide the trace ID from the logs"
  ]
}
```

### mark_potential_duplicates

Marks tickets as potential duplicates of a primary ticket by prepending "[potential duplicate]" to their summaries (titles) and linking them to the primary ticket with a "relates to" relationship.

**Parameters:**

- `primaryTicket` (required): The key of the primary ticket (e.g., 'PROJECT-123').
- `duplicateTickets` (required): Array of ticket keys to mark as potential duplicates.

**Example Usage:**

```javascript
// Example of how to use with an MCP client
const result = await mcpClient.useTool('jira-server', 'mark_potential_duplicates', {
  primaryTicket: 'PROJECT-123',
  duplicateTickets: ['PROJECT-124', 'PROJECT-125', 'PROJECT-126']
});

console.log(`Marked ${result.results.length} tickets as potential duplicates`);
console.log(result);
```

**Response Format:**

```json
{
  "primaryTicket": "PROJECT-123",
  "results": [
    {
      "key": "PROJECT-124",
      "success": true,
      "message": "Marked as potential duplicate and linked to PROJECT-123"
    },
    {
      "key": "PROJECT-125",
      "success": true,
      "message": "Marked as potential duplicate and linked to PROJECT-123"
    },
    {
      "key": "PROJECT-126",
      "success": false,
      "error": "Error message details"
    }
  ]
}
```

### get_bug_tickets

Retrieves Jira tickets that are classified as bugs.

**Parameters:**

- `project` (optional): Jira project key. If not provided, uses the JIRA_PROJECT_KEY from your .env file.
- `maxResults` (optional): Maximum number of results to return. Default is 10.
- `status` (optional): Filter bugs by status (e.g., "Open", "In Progress", "Done"). If not provided, only returns bugs that are not in "Closed" or "Done" status.

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

### create_bug

Creates a new bug ticket in Jira with required tags. It is recommended to use prepare_bug_ticket first to validate the information.

**Parameters:**

- `project` (optional): Jira project key. If not provided, uses the JIRA_PROJECT_KEY from your .env file.
- `summary` (required): Summary/title of the bug.
- `description` (required): Detailed description of the bug.
- `priority` (optional): Priority of the bug (e.g., "Highest", "High", "Medium", "Low", "Lowest"). When determining the priority, consider:
  - **Highest/Critical**: Issue is blocking all development or production usage with no workaround available
  - **High**: Significant impact on core functionality with no reasonable workaround
  - **Medium**: Important issue with a viable workaround available
  - **Low**: Minor issue that doesn't significantly impact functionality
  - **Lowest**: Cosmetic or enhancement request
  
  AI clients should ask the user if the issue is blocking all development or if they have a workaround, and then determine the appropriate priority based on the response.
- `assignee` (optional): Username of the person to assign the bug to.
- `additionalLabels` (optional): Array of additional labels to add to the bug. The tool will always include "mcp" and "potential-issue" labels.
- `component` (optional): Component the bug is related to. It's recommended to use one of the following values: "experience layer", "property catalog", "guest info", "web", "mobile", "ciam", "loyalty".
- `curlCommand` (optional): A curl command that reproduces the issue.
- `traceId` (optional): A trace ID or x-request-id if a curl command cannot be provided.

**Note:** Either a curl command or a trace ID must be provided to create a bug ticket. This ensures that the bug can be reproduced or traced back to a specific request.

**Example Usage:**

```javascript
// Example of how to use with an MCP client
// Step 1: Validate the bug ticket information
const validationResult = await mcpClient.useTool('jira-server', 'prepare_bug_ticket', {
  summary: 'API returns 500 error when accessing /users endpoint',
  description: 'When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error',
  priority: 'High',
  curlCommand: 'curl -X GET https://api.example.com/users -H "Authorization: Bearer token123"'
});

// Step 2: If validation passes, create the bug ticket
if (validationResult.isComplete) {
  const result = await mcpClient.useTool('jira-server', 'create_bug', {
    project: 'PROJECT',
    summary: 'API returns 500 error when accessing /users endpoint',
    description: 'When accessing the /users endpoint with valid credentials, the API returns a 500 error instead of the expected user data.\n\nSteps to reproduce:\n1. Authenticate with valid credentials\n2. Send a GET request to /users endpoint\n3. Observe the response\n\nExpected: 200 OK with user data\nActual: 500 Internal Server Error',
    priority: 'High',
    assignee: 'john.doe',
    additionalLabels: ['api', 'server-error'],
    curlCommand: 'curl -X GET https://api.example.com/users -H "Authorization: Bearer token123"'
  });

  console.log(`Bug created with key: ${result.key}`);
} else {
  console.log('Bug ticket information is incomplete. Please provide the missing information.');
  console.log(validationResult.missingInformation);
}
```

**Response Format:**

For successful creation:

```json
{
  "success": true,
  "key": "PROJECT-123",
  "id": "10001",
  "self": "https://your-domain.atlassian.net/rest/api/3/issue/10001",
  "message": "Bug ticket created successfully with key: PROJECT-123"
}
```

For validation failure:

```json
{
  "success": false,
  "message": "Bug ticket information is incomplete. Please use prepare_bug_ticket to validate the information first.",
  "validationResult": {
    "isComplete": false,
    "missingInformation": [
      {
        "field": "reproduction",
        "message": "Please provide either a curl command that reproduces the issue OR a trace ID/x-request-id"
      }
    ],
    "recommendations": [
      "Add a curl command with proper headers and payload",
      "If curl is not possible, provide the trace ID from the logs"
    ]
  }
}
```

For other errors:

```json
{
  "success": false,
  "error": "Error message details"
}
```

## Recommended Workflow

When creating bug tickets, it's recommended to follow this workflow:

1. Use the `prepare_bug_ticket` tool to validate the bug ticket information
2. If validation fails, ask the user for the missing information
3. Once validation passes, use the `create_bug` tool to create the bug ticket

This ensures that all bug tickets have the necessary information for developers to reproduce and fix the issue.

## Error Handling

The server includes error handling for common issues:
- Invalid Jira credentials
- Network connectivity problems
- Invalid JQL queries

Errors will be logged to the console with descriptive messages.
