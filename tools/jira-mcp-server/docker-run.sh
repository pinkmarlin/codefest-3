#!/bin/bash

# Script to build and run the Jira MCP Server Docker container

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Jira MCP Server Docker Helper${NC}"
echo "----------------------------------------"

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found!${NC}"
  echo "Creating .env file from .env.example..."
  
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env file. Please edit it with your Jira credentials before continuing."
    exit 1
  else
    echo "Error: .env.example file not found!"
    echo "Please create a .env file with your Jira credentials."
    exit 1
  fi
fi

# Function to display usage
show_usage() {
  echo "Usage:"
  echo "  ./docker-run.sh [command]"
  echo ""
  echo "Commands:"
  echo "  build       - Build the Docker image"
  echo "  run         - Run the Docker container"
  echo "  start       - Build and run the Docker container"
  echo "  compose     - Run using docker-compose"
  echo "  compose-d   - Run using docker-compose in detached mode"
  echo "  stop        - Stop the running container"
  echo "  help        - Show this help message"
  echo ""
}

# Check command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 1
fi

case "$1" in
  build)
    echo -e "${GREEN}Building Docker image for linux/amd64 platform...${NC}"
    docker build --platform linux/amd64 -t jira-mcp-server .
    ;;
    
  run)
    echo -e "${GREEN}Running Docker container...${NC}"
    docker run -p 3000:3000 --env-file .env jira-mcp-server
    ;;
    
  start)
    echo -e "${GREEN}Building Docker image for linux/amd64 platform...${NC}"
    docker build --platform linux/amd64 -t jira-mcp-server .
    echo -e "${GREEN}Running Docker container...${NC}"
    docker run -p 3000:3000 --env-file .env jira-mcp-server
    ;;
    
  compose)
    echo -e "${GREEN}Starting with docker-compose...${NC}"
    docker-compose up
    ;;
    
  compose-d)
    echo -e "${GREEN}Starting with docker-compose in detached mode...${NC}"
    docker-compose up -d
    echo -e "${GREEN}Container is running in the background.${NC}"
    echo "To view logs: docker-compose logs -f"
    echo "To stop: docker-compose down"
    ;;
    
  stop)
    echo -e "${GREEN}Stopping containers...${NC}"
    docker-compose down
    ;;
    
  help)
    show_usage
    ;;
    
  *)
    echo -e "${YELLOW}Unknown command: $1${NC}"
    show_usage
    exit 1
    ;;
esac

exit 0
