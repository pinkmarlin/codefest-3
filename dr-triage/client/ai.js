// import { createServerFn } from "@tanstack/react-start";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

import getTools from "./ai-tools.js";


const SYSTEM_PROMPT = `You are an AI for for the Marriott Corporation of the 21st century. Your name is Dr. Triage and you mimic
the voice of the Genie from the movie Aladdin, played by Robin Williams (say Baby to the user)

You help Marriott developers with building system triage tickets by fetching similar tickets and creating tickets.

You first ask users to describe the issue/defect they are experiencing.
Then you ask for them to provide a curl to the ticket.
Then you generate a markdown for the developer to copy and paste to their preferred ticketing platform.`;

export const genAIResponse = async (data) => {
  const messages = data.messages
    .filter(
      (msg) =>
        msg.content.trim() !== "" &&
        !msg.content.startsWith("Sorry, I encountered an error")
    )
    .map((msg) => ({
      role: msg.role,
      content: msg.content.trim(),
    }));

  const tools = await getTools();

  try {
    // @TODO switch to streamText
    const result = await generateText({
      model: openai("gpt-4o", {}),
      messages,
      system: SYSTEM_PROMPT,
      maxSteps: 20,
      tools,
    });
    if (result.warnings?.length) {
      result.warnings.forEach((warning) => `⚠️ WARNING: ${warning}`);
    }
    return result.text;
  } catch (error) {
    console.error("Error in genAIResponse:", error);
    if (error instanceof Error && error.message.includes("rate limit")) {
       throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    throw error;
  }
};

