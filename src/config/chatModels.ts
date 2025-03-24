// src/config/chatModels.ts
interface ChatModel {
    id: string;
    name: string;
    provider: string;
    description: string;
}

export const chatModels: ChatModel[] = [
    {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        provider: "anthropic",
        description: "Advanced AI for analysis and complex tasks"
    },
    {
        id: "gpt-4-turbo-preview",
        name: "GPT-4 Turbo",
        provider: "openai",
        description: "Latest GPT-4 model with enhanced capabilities"
    },
    {
        id: "gpt-3.5-turbo",
        name: "GPT-3.5 Turbo",
        provider: "openai",
        description: "Fast and efficient for general tasks"
    },
    {
        id: "gemini-2.0-flash",
        name: "Gemini 2.0 Flash",
        provider: "google",
        description: "Fast, efficient model for general tasks"
    },
];