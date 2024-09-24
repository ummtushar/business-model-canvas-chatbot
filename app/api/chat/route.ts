import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function readTextFiles(fileNames: string[]): Promise<string> {
  const fileContents = await Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(process.cwd(), 'prompts', fileName);
      return await fs.readFile(filePath, 'utf-8');
    })
  );
  return fileContents.join('\n\n');
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const additionalPrompts1 = await readTextFiles(['graph_customer_v1.1.txt']);

    const additionalPrompts2 = await readTextFiles(['prompt_customer_v1.2.txt']);

    const systemPrompt = `
YOUR JOB IS TO STRICTLY CREATE A BUINESS MODEL CANVAS
Strictly follow the rules:
Step 1) Read the prompt text file (.txt) file ${additionalPrompts2} and make sure that you remember these instructions throughly during the entirity of your interactions with the user.

The next step is something you should ask the user after you have helped them with what they ask you. For example, If you have provided them with the service they asked you to do, you can ask them something along the lines "Would you like to visualise this?".

Step 2) Read the graph text (.txt) file ${additionalPrompts1} for the python code for visualising/plotting. Furthermore, look through other knowledge file if there is something relevant for the python code.

`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 16000,
    });

    return NextResponse.json(response.choices[0].message);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}