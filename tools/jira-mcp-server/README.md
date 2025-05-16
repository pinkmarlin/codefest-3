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
