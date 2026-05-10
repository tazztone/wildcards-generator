
// Mock Config
const Config = {
    ENABLE_PROMPT_CACHING: true,
    API_ENDPOINT: 'openrouter',
    CACHE_TTL: '1h'
};

// Extracted Logic from Api.js for verification in Node
function constructMultipartContent(globalPrompt, userPrompt, model) {
    // Only apply caching if enabled and using OpenRouter
    const useCaching = Config.ENABLE_PROMPT_CACHING && Config.API_ENDPOINT === 'openrouter';
    const isAnthropic = model.includes('claude');
    const content = [];

    // Handle globalPrompt (can be string or array of parts)
    if (Array.isArray(globalPrompt)) {
        globalPrompt.forEach((part, index) => {
            const item = { type: "text", text: part.text };
            // Apply cache control if requested and enabled
            if (useCaching && part.cache) {
                item.cache_control = { type: "ephemeral" };
                // For Anthropic models, explicit TTL is supported to extend cache lifetime
                if (isAnthropic && Config.CACHE_TTL) {
                    item.cache_control.ttl = Config.CACHE_TTL;
                }
            }
            content.push(item);
        });
    } else {
        // Standard string system prompt
        const item = { type: "text", text: globalPrompt };
        if (useCaching) {
            item.cache_control = { type: "ephemeral" };
        }
        content.push(item);
    }

    // Add user prompt (never cached usually, as it changes)
    content.push({ type: "text", text: userPrompt });

    return content;
}

// Test Cases
const testCases = [
    {
        name: "Anthropic Model (Should have TTL)",
        model: "anthropic/claude-3-opus",
        globalPrompt: [{ text: "System Prompt", cache: true }],
        userPrompt: "User Prompt"
    },
    {
        name: "Anthropic Model (No Cache Flag on Part)",
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

console.log("Running Prompt Caching Logic Verification...\n");

testCases.forEach(test => {
    console.log(`Test: ${test.name}`);
    const content = constructMultipartContent(test.globalPrompt, test.userPrompt, test.model);
    console.log(JSON.stringify(content, null, 2));

    // Assertions
    if (test.name === "Anthropic Model (Should have TTL)") {
        if (content[0].cache_control?.ttl === '1h') console.log("PASS: TTL present");
        else console.error("FAIL: TTL missing");
    }
    if (test.name === "Non-Anthropic Model (No TTL)") {
        if (content[0].cache_control && !content[0].cache_control.ttl) console.log("PASS: TTL correctly absent");
        else console.error("FAIL: TTL present when not expected");
    }

    console.log("---------------------------------------------------");
});
