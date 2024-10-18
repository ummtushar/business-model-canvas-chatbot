import { promises as fs } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Chat = {
  messages: Message[];
};

type Model = 'VPC' | 'BMC';

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
    const { action, chatId, messages, model } = await req.json();

    if (action === 'load') {
      if (!chatId) {
        return NextResponse.json({ success: false, message: 'Chat ID is missing' }, { status: 400 });
      }
      const chat = chats[chatId];
      return chat
        ? NextResponse.json({ success: true, messages: chat.messages })
        : NextResponse.json({ success: false, message: 'Chat not found' }, { status: 404 });
    }

    if (action === 'save') {
      if (!chatId || !messages) {
        return NextResponse.json({ success: false, message: 'Invalid data' }, { status: 400 });
      }
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

    if (!messages || !Array.isArray(messages) || !model) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    let systemPrompt: string;
    let additionalPrompts: string[];

    if (model === 'BMC') {
      additionalPrompts = [
        'graph_customer_v1.1.txt',
        'prompt_customer_v1.2.txt',
        'prompt_infrastructure_business_v1.2.txt',
        'graph_business_infrastructurev1.1.txt'
      ];
      systemPrompt = `
        YOUR JOB IS TO STRICTLY CREATE A COMPREHENSIVE BUSINESS MODEL CANVAS
        Strictly follow the rules:
        Step 1) Read the prompt text files (.txt) and make sure that you remember these instructions thoroughly during your entire interaction with the user.

        After you've provided the requested service, you can ask the user if they want to visualize the outcome. For example: "Would you like to visualize this?"

        Step 2) Read the graph text files (.txt) for the python code for visualizing/plotting. Also, check other knowledge files for relevant python code.

        Your task is to create a complete Business Model Canvas, including both the customer-focused and business infrastructure aspects. This includes:

        1. Customer-focused aspects:
           - Value Proposition
           - Customer Segments
           - Customer Channels
           - Customer Relationships
           - Revenue Streams

        2. Business infrastructure aspects:
           - Key Partners
           - Key Activities
           - Key Resources
           - Cost Structure

        Provide detailed information for each of these components, ensuring they are interconnected and form a cohesive business model. Always consider the feasibility, legality, and potential impact on the environment and people when developing the business model.

        If there are any concerns about the business idea's impact on the environment or people, warn the user and provide alternative ideas.

        After completing the Business Model Canvas, offer to visualize the information using the provided Python code for both the customer-focused and business infrastructure aspects.
      `;
    } else if (model === 'VPC') {
      additionalPrompts = ['prompt_VPC.txt'];
      systemPrompt = `
        YOUR JOB IS TO STRICTLY CREATE A VALUE PROPOSITION CANVAS
        Strictly follow the rules:
        Step 1) Read the prompt text file (.txt) and make sure that you remember these instructions thoroughly during your entire interaction with the user.

        Your task is to guide the user through creating a Value Proposition Canvas, which includes:

        1. Customer Profile:
           - Customer Jobs
           - Customer Pains
           - Customer Gains

        2. Value Map:
           - Products and Services
           - Pain Relievers
           - Gain Creators

        Provide detailed information for each of these components, ensuring they are interconnected and form a cohesive value proposition. Always consider the feasibility and alignment with customer needs.

        If there are any concerns about the idea's viability or ethical implications, discuss these with the user and provide alternative suggestions.

        After completing the Value Proposition Canvas, summarize the key points and how they align to create a strong value proposition.
      `;
    } else {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    const promptContent = await readTextFiles(additionalPrompts);
    const fullSystemPrompt = `${systemPrompt}\n\nAdditional context:\n${promptContent}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: fullSystemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response content from AI' }, { status: 500 });
    }

    const processedResponse = processResponse(content);

    return NextResponse.json({ content: processedResponse });
  } catch (error) {
    console.error('Error processing the request:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}

function processResponse(content: string): string {
  // Remove markdown formatting
  content = content.replace(/[*_`#]/g, '');

  // Add HTML formatting for better readability
  content = content.replace(/\n\n/g, '</p><p>');
  content = content.replace(/\n/g, '<br>');
  content = `<p>${content}</p>`;

  // Add headings for each section of the Business Model Canvas or Value Proposition Canvas
  const bmcSections = [
    'Value Proposition',
    'Customer Segments',
    'Customer Channels',
    'Customer Relationships',
    'Revenue Streams',
    'Key Partners',
    'Key Activities',
    'Key Resources',
    'Cost Structure'
  ];

  const vpcSections = [
    'Customer Jobs',
    'Customer Pains',
    'Customer Gains',
    'Products and Services',
    'Pain Relievers',
    'Gain Creators'
  ];

  const allSections: string[] = Array.from(new Set([...bmcSections, ...vpcSections]));

  allSections.forEach(section => {
    const regex = new RegExp(`(${section}:)`, 'gi');
    content = content.replace(regex, `</p><h3>$1</h3><p>`);
  });

  return content;
}