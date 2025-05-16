import {
    McpServer,
    ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import { z } from "zod";
import { searchSimilarDefects } from "./jira.js";
import {runAndAnalyzeCurl} from './curl.js';

export default function getMcpServer() {
    const server = new McpServer({
        name: "pmt-mcp-server",
        version: "1.0.0",
    });

    // Dynamic resource with parameters
    // @TODO use ticket sources
    // server.resource(
    //     "ticket",
    //     new ResourceTemplate("tickets://{ticketId}", { list: undefined }),
    //     async (uri, { ticketId }) => ({
    //         contents: [
    //             {
    //                 uri: uri.href,
    //                 text: `defect info for ${ticketId}`,
    //             },
    //         ],
    //     })
    // );

    server.tool(
        "searchSimilarDefects",
        "Runs a full text searches for similar Jira tickets and defects relating to a given defect description",
        {
            description: z.string().describe('The description field to be used to search similar defects'),
        },
        async ({ description }) => {
            const defects = await searchSimilarDefects(description, "Open");
            // @TODO make a resource for defect and return an array of resources
            const text = JSON.stringify(
                {
                    total: bugs.length, // Use the actual number of bugs we're returning
                    bugs,
                },
                null,
                2
            );
            return {
                content: [{ type: "text", text }],
            };
        }
    );

    server.tool(
        "runCurlCommand",
        "Runs a curl command and converts the response into a defect markdown format for the user to copy and paste into a jira ticket",
        {
            description: z.string().describe("Short explanation of the ticket").optional(),
            curl: z.string().describe("The bash curl command to execute")
          },
        async ({ description, curl }) => {
            const defects = await runAndAnalyzeCurl(curl, description);
            // @TODO creates defect for you in jira
            return {
                content: [{ type: "text", text: await runAndAnalyzeCurl(curl, description)}],
            };
        }
    );

    return server;
}
