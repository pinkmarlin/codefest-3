import { text, intro, outro, spinner, cancel, isCancel } from "@clack/prompts";
import {drTriageArt, getRandomGenieLine} from './src/dr-triage.js';
import {genAIResponse} from './src/ai.js';
import 'dotenv/config'

const messages = [];

const addMessage = (content, role) => {
  messages.push({id: messages.length + '', content, role});
}

const s = spinner();

async function run() {

  s.start();
  const prompt = await genAIResponse({messages});
  s.stop();
  addMessage(prompt, 'assistant');
  const response = await text({ message: `🧞 ${prompt}`});
  if (isCancel(response)) {
    cancel('Operation cancelled.');
    process.exit(0);
  }
  addMessage(response.toString(), 'user');
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
