// src/utils/runCurl.ts
import { exec } from "node:child_process";
import { randomUUID } from "node:crypto";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Executes a given curl as a child process
 * @param {string} curl - the curl string
 * @param {string} [description] - information about the curl
 * @returns Promise<{stderr: string; stdout: string; requestId?: string; isGraphQL?: boolean}>
 */
async function execute(curl, description) {
    if (!curl.trim().startsWith("curl ")) {
        return {
            stdout: '',
            stderr: `❌ Command must start with 'curl '. Received: ${curl.slice(0, 10)}...`
        };
    }

    const isGraphQL = /--data(-raw)?\s+['"]?\{[^]*?"query"\s*:/.test(curl);

    if (isGraphQL) {
        console.log("🧠 Detected GraphQL curl request");
        // @TODO add UXL/DTT specific headers, like uxl-datasource-insights/x-request-id for creating traces, etc
    }

    // Detect x-request-id header
    let requestId = '';
    const requestIdMatch = curl.match(/--header\s+['"]x-request-id\s*:\s*([^'"]+)/i);
    if (requestIdMatch) {
        requestId = requestIdMatch[1].trim();
    } else {
        requestId = randomUUID();
        console.log(`🆔 Injecting x-request-id: ${requestId}`);
        curl += ` \\\n--header 'x-request-id: ${requestId}'`;
    }

    try {
        const response = await execAsync(curl);
        // @TODO parse stdout to only get json or just convert the bash curl to a request 
        return { ...response, isGraphQL, requestId };
    } catch (err) {
        return {
            stdout: err.message,
            stderr: `❌ Curl execution failed:\n${err.stderr || err.message}`,
            isGraphQL,
            requestId
        };
    }
}

/**
 * Analyzes a given curl's response and returns as markdown
 * @param {string} curl- the curl
 * @param {string} stdout - the curl output 
 * @param {string} [description] - information about the curl from the user
 * @param {string} [requestId] - the trace id
 * @returns Promise<string>;
 */
export function analyze(curl, stdout, description, requestId) {
    // @TODO add AI to analyze the curl output
    const defectMarkdown = `
## 🐛 Defect

**Description:**  
${description}

**Request Curl:**

\`\`\`bash
${curl}
\`\`\`

**Response:**

\`\`\`json
${stdout}
\`\`\`

> 📎 Request ID: \`${requestId || 'none'}\`
`;
    return defectMarkdown;
}

/**
 * Runs a given curl, analyzes the given result, returns a defect markdown
 * @param {string} curl - the curl string
 * @param {string} [description] - information about the curl
 * @returns Promise<string>
 */
export async function runAndAnalyzeCurl(curl, description) {
    console.log('Run And Analyze Curl');
    try {
        const { stdout, stderr, isGraphQL, requestId } = await execute(curl, description);
        return analyze(curl, stdout || stderr, description, requestId);
    } catch (e) {
        console.error('Failed to run/analyze curl', e);

    }
}

