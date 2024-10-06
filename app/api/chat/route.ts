// import { promises as fs } from 'fs';
// import path from 'path';
// import { NextResponse } from 'next/server';
// import OpenAI from 'openai';

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// async function readTextFiles(fileNames: string[]): Promise<string> {
//   const fileContents = await Promise.all(
//     fileNames.map(async (fileName) => {
//       const filePath = path.join(process.cwd(), 'prompts', fileName);
//       return await fs.readFile(filePath, 'utf-8');
//     })
//   );
//   return fileContents.join('\n\n');
// }

// export async function POST(req: Request) {
//   try {
//     const { messages } = await req.json();

//     const additionalPrompts1 = await readTextFiles(['graph_customer_v1.1.txt']);

//     const additionalPrompts2 = await readTextFiles(['prompt_customer_v1.2.txt']);

//     const systemPrompt = `
// YOUR JOB IS TO STRICTLY CREATE A BUINESS MODEL CANVAS
// Strictly follow the rules:
// Step 1) Read the prompt text file (.txt) file ${additionalPrompts2} and make sure that you remember these instructions throughly during the entirity of your interactions with the user.

// The next step is something you should ask the user after you have helped them with what they ask you. For example, If you have provided them with the service they asked you to do, you can ask them something along the lines "Would you like to visualise this?".

// Step 2) Read the graph text (.txt) file ${additionalPrompts1} for the python code for visualising/plotting. Furthermore, look through other knowledge file if there is something relevant for the python code.

// `;

//     const response = await openai.chat.completions.create({
//       model: "gpt-4o-mini",
//       messages: [
//         { role: "system", content: systemPrompt },
//         ...messages,
//       ],
//       temperature: 0.7,
//       // max_tokens: 65000,
//       // max_completion_tokens: 65000,
//     });

//     return NextResponse.json(response.choices[0].message);
//   } catch (error) {
//     console.error('Error:', error);
//     return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
//   }
// }

import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define the type for messages
type Message = {
  role: 'user' | 'assistant';
  content: string;
};

// Define the chat structure
type Chat = {
  messages: Message[];
};

// In-memory storage for chat data
const chats: Record<string, Chat> = {};

async function readTextFiles(fileNames: string[]): Promise<string> {
  try {
    const fileContents = await Promise.all(
      fileNames.map(async (fileName) => {
        const filePath = path.join(process.cwd(), 'prompts', fileName);
        return await fs.readFile(filePath, 'utf-8');
      })
    );
    return fileContents.join('\n\n');
  } catch (error) {
    console.error(`Error reading files: ${fileNames.join(', ')}`, error);
    throw new Error('Failed to read prompt files');
  }
}

export async function POST(req: Request) {
  try {
    const { action, chatId, messages } = await req.json();

    if (action === 'load') {
      if (!chatId) {
        return NextResponse.json({ success: false, message: 'Chat ID is missing' }, { status: 400 });
      }

      const chat = chats[chatId];
      if (chat) {
        return NextResponse.json({ success: true, messages: chat.messages });
      } else {
        return NextResponse.json({ success: false, message: 'Chat not found' }, { status: 404 });
      }
    }

    if (action === 'save') {
      if (!chatId || !messages) {
        return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
      }

      // Save the chat messages
      chats[chatId] = { messages };
      return NextResponse.json({ success: true, message: 'Chat saved' });
    }

    if (action === 'delete') {
      if (!chatId) {
        return NextResponse.json({ success: false, message: 'Chat ID is missing' }, { status: 400 });
      }

      delete chats[chatId];
      return NextResponse.json({ success: true, message: 'Chat deleted' });
    }

    // Continue with processing OpenAI API for the 'messages' if no action specified
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages must be an array' }, { status: 400 });
    }

    // Load the additional prompts from files
    const additionalPrompts1 = await readTextFiles(['graph_customer_v1.1.txt']);
    const additionalPrompts2 = await readTextFiles(['prompt_customer_v1.2.txt']);

    // System prompt construction
    const systemPrompt = `
YOUR JOB IS TO STRICTLY CREATE A BUSINESS MODEL CANVAS.
Strictly follow the rules:
Step 1) Read the prompt text file (.txt) ${additionalPrompts2} and make sure that you remember these instructions thoroughly during your entire interaction with the user.

After you've provided the requested service, you can ask the user if they want to visualize the outcome. For example: "Would you like to visualize this?"

Step 2) Read the graph text file (.txt) ${additionalPrompts1} for the python code for visualizing/plotting. Also, check other knowledge files for relevant python code.
`;

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    // Return the response from OpenAI
    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('Error processing the request:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}
