import { text, intro, outro, spinner, cancel, isCancel } from "@clack/prompts";
import { drTriageArt, getRandomGenieLine } from './client/dr-triage.js';
import { genAIResponse } from './client/ai.js';
import { getPlaceholder } from "./client/placeholders.js";
import { getCurl } from './client/get-curl.js';
import 'dotenv/config';

const messages = [];
const placeholders = [];

const addMessage = (content, role) => {
  messages.push({ id: messages.length + '', content, role });
}

const s = spinner();

async function question(prompt) {
  
  const placeholder = getPlaceholder(prompt, placeholders); // insert previous placeholders to prevent duplicates

  let response;

  if (placeholder) {
    placeholders.push(placeholder);
    switch(placeholder.code) {
      case 'curl':
        // If asking for a curl, select a bash file
        response = await getCurl(`🧞 ${prompt}`, placeholder.text);
        break;
      default:
        response = await text({ message: `🧞 ${prompt}`});
        break;
    }
  } else {
    response = await text({ message: `🧞 ${prompt}`});
  }

  if (isCancel(response)) {
    cancel('Operation cancelled.');
    process.exit(0);
  } else if (!response) {
    return question(prompt);
  }
  return response.toString();
}

async function run() {
  s.start();
  const prompt = await genAIResponse({ messages });
  s.stop();
  addMessage(prompt, 'assistant');
  const response = await question(`🧞 ${prompt}`);
  addMessage(response, 'user');
  return run();
}

async function main() {
  console.log(drTriageArt);
  intro("🧞 Dr. Triage at your service");

  process.on('SIGINT', () => {
    outro("Closing program");
    process.exit(0);
  });

  // Initialize
  const prompt = getRandomGenieLine();
  addMessage(prompt, 'assistant');
  const response = await text({ message: `🧞 ${prompt}`, placeholder: 'search lar is not working!' });
  addMessage(response, 'user');

  await run();
}


main();
