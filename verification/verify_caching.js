
import { Config } from '../js/config.js';
import { Api } from '../js/api.js';

// Mock Config
Config.ENABLE_PROMPT_CACHING = true;
Config.API_ENDPOINT = 'openrouter';
Config.CACHE_TTL = '1h';

// Test Cases
const testCases = [
    {
        name: "Anthropic Model (Should have TTL)",
        model: "anthropic/claude-3-opus",
        globalPrompt: [{ text: "System Prompt", cache: true }],
        userPrompt: "User Prompt"
    },
    {
        name: "Anthropic Model (No Cache Flag)",
        model: "anthropic/claude-3-opus",
        globalPrompt: [{ text: "System Prompt", cache: false }],
        userPrompt: "User Prompt"
    },
    {
        name: "Non-Anthropic Model (No TTL)",
        model: "openai/gpt-4",
        globalPrompt: [{ text: "System Prompt", cache: true }],
        userPrompt: "User Prompt"
    },
    {
        name: "String Prompt (Standard)",
        model: "anthropic/claude-3-opus",
        globalPrompt: "Simple System Prompt",
        userPrompt: "User Prompt"
    }
];

console.log("Running Prompt Caching Verification...\n");

testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    const content = Api._constructMultipartContent(test.globalPrompt, test.userPrompt, test.model);
    console.log(JSON.stringify(content, null, 2));
    console.log("---------------------------------------------------");
});
