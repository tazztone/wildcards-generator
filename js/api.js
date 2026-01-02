import { Config } from './config.js';

export const Api = {
    activeController: null,

    async _makeRequest(globalPrompt, userPrompt, generationConfig) {
        if (this.activeController) this.activeController.abort();
        this.activeController = new AbortController();

        try {
            const { url, payload, headers } = this._prepareRequest(globalPrompt, userPrompt, generationConfig);
            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.any([this.activeController.signal, AbortSignal.timeout(30000)])
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            const result = await response.json();
            return { result, request: { url, headers, payload } };
        } catch (error) {
            if (error.name === 'AbortError') throw new Error("Request timed out or was aborted.");
            console.error("Error calling LLM API:", error);
            throw error;
        } finally {
            this.activeController = null;
        }
    },

    /**
     * Make a streaming request to the LLM API with progress callbacks.
     * Uses SSE (Server-Sent Events) format to receive streamed responses.
     */
    async _makeStreamingRequest(globalPrompt, userPrompt, generationConfig, onProgress) {
        if (this.activeController) this.activeController.abort();
        this.activeController = new AbortController();
        const startTime = Date.now();

        try {
            const { url, payload, headers } = this._prepareRequest(globalPrompt, userPrompt, generationConfig);
            payload.stream = true; // Enable streaming

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
                signal: AbortSignal.any([this.activeController.signal, AbortSignal.timeout(60000)])
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API request failed: ${response.status} - ${errorText}`);
            }

            // Parse SSE stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedText = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6).trim();
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            // Handle both OpenRouter/OpenAI and Gemini formats
                            const content = parsed.choices?.[0]?.delta?.content ||
                                parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (content) {
                                accumulatedText += content;
                                if (onProgress) {
                                    onProgress({
                                        text: accumulatedText,
                                        elapsed: Date.now() - startTime
                                    });
                                }
                            }
                        } catch (e) {
                            // Ignore parse errors for malformed chunks
                        }
                    }
                }
            }

            return {
                result: { text: accumulatedText },
                elapsed: Date.now() - startTime,
                request: { url, headers, payload }
            };
        } catch (error) {
            if (error.name === 'AbortError') throw new Error("Request timed out or was aborted.");
            console.error("Error calling LLM API (streaming):", error);
            throw error;
        } finally {
            this.activeController = null;
        }
    },

    async generateWildcards(globalPrompt, categoryPath, existingWords, customInstructions, systemPrompt) {
        const readablePath = categoryPath.replace(/\//g, ' > ').replace(/_/g, ' ');
        const userPrompt = `Category Path: '${readablePath}'\nExisting Wildcards: ${existingWords.slice(0, 50).join(', ')}\nCustom Instructions: "${customInstructions.trim()}"`;
        const generationConfig = { responseMimeType: "application/json", responseSchema: { type: "ARRAY", items: { type: "STRING" } } };

        const { result } = await this._makeRequest(systemPrompt, userPrompt, generationConfig);
        return this._parseResponse(result);
    },

    async suggestItems(parentPath, structure, suggestItemPrompt) {
        const readablePath = parentPath ? parentPath.replace(/\//g, ' > ').replace(/_/g, ' ') : 'Top-Level';
        const globalPrompt = suggestItemPrompt.replace('{parentPath}', readablePath);
        const userPrompt = `For context, here are the existing sibling items at the same level:\n${JSON.stringify(structure, null, 2)}\n\nPlease provide new suggestions for the '${readablePath}' category.`;
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        name: {
                            type: "STRING",
                            description: "A unique, descriptive name for a new sub-category. MUST use underscores_between_words. MUST NOT be a generic placeholder. MUST NOT contain the parent category's name."
                        },
                        instruction: {
                            type: "STRING",
                            description: "A brief, helpful description of the item's purpose."
                        }
                    },
                    required: ["name", "instruction"]
                }
            }
        };

        const { result, request } = await this._makeRequest(globalPrompt, userPrompt, generationConfig);
        return { suggestions: this._parseResponse(result), request };
    },

    async testConnection(provider, uiCallback) {
        if (uiCallback) uiCallback(`Testing connection to ${provider}...`, 'info');

        try {
            let url, requestOptions = { method: 'GET' };

            // We need to read values from DOM here because they might not be saved to Config yet
            // or we might want to pass them in. For now, reading DOM in api.js is dirty. 
            // Better pattern: Pass the specific key/url as arguments. 
            // For now, to match legacy behavior without massive refactor of call sites, we'll access DOM elements if needed, 
            // OR prefer using Config if keys are synced.
            // Let's assume the UI updates Config before calling this, OR we look up elements. 
            // Looking up elements is "God Object" style. Let's try to be cleaner.
            // Actually, the original code read from DOM inputs.

            const getKey = (id) => document.getElementById(id)?.value?.trim() || '';
            const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

            if (provider === 'gemini') {
                const apiKey = getKey('gemini-api-key');
                if (!apiKey) throw new Error("Gemini API key not provided.");
                url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
            } else if (provider === 'openrouter') {
                url = `https://openrouter.ai/api/v1/models`;
            } else if (provider === 'custom') {
                const customUrl = getVal('custom-api-url');
                if (!customUrl) throw new Error("Custom API URL is not provided.");
                url = `${customUrl.replace(/\/$/, '')}/models`;
                const apiKey = getKey('custom-api-key');
                const headers = {};
                if (apiKey) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }
                if (Object.keys(headers).length > 0) {
                    requestOptions.headers = headers;
                }
            }

            if (!url) throw new Error("Could not determine URL for testing.");

            const response = await fetch(url, requestOptions);
            if (!response.ok) {
                const errorText = await response.text().catch(() => 'Could not retrieve error details.');
                throw new Error(`Request failed: ${response.status} ${response.statusText}. Response: ${errorText}`);
            }
            const data = await response.json();

            let successMessage = '';
            let models = [];

            if (provider === 'gemini') {
                if (!data.models) throw new Error('Invalid response from Gemini API.');
                successMessage = `Gemini connection successful! Found ${data.models.length} models.`;
                models = data.models;
            } else if (provider === 'openrouter') {
                // OpenRouter sometimes returns { data: [...] } and sometimes might return [...] depending on the endpoint/proxy.
                // Standard is { data: [...] }
                const list = Array.isArray(data) ? data : (data.data || []);
                if (!list.length && !Array.isArray(list)) throw new Error('Invalid response from OpenRouter API.');

                successMessage = `OpenRouter connection successful! Found ${list.length} models.`;
                models = list;
            } else if (provider === 'custom') {
                // OpenAI compatible usually { data: [...] }
                const list = Array.isArray(data) ? data : (data.data || []);
                // Allow empty list if compatible but no models found?
                successMessage = `Custom API connection successful! Found ${list.length} models.`;
                models = list;
            }

            if (uiCallback) uiCallback(successMessage, 'success');
            return models; // Return models so UI can populate lists

        } catch (error) {
            console.error("Connection Test Error:", error);
            let message = `Connection failed: ${error.message}`;
            if (error instanceof TypeError && error.message === 'Failed to fetch') {
                message += '\n\nThis is likely a Cross-Origin Resource Sharing (CORS) issue.';
            }
            if (uiCallback) uiCallback(message, 'error'); // Use 'error' type for notification
            throw error;
        }
    },

    _prepareRequest(globalPrompt, userPrompt, generationConfig = {}) {
        const endpoint = document.getElementById('api-endpoint').value; // Still reading DOM for active endpoint
        let apiKey, url, payload, headers = { 'Content-Type': 'application/json' };

        const getKey = (id) => document.getElementById(id)?.value?.trim() || '';
        const getVal = (id) => document.getElementById(id)?.value?.trim() || '';

        if (endpoint === 'gemini') {
            apiKey = getKey('gemini-api-key');
            const model = getVal('gemini-model-name') || 'gemini-1.5-flash';
            if (!apiKey) throw new Error("Gemini API key is not provided.");
            url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
            payload = {
                contents: [
                    { role: "user", parts: [{ text: globalPrompt }] },
                    { role: "model", parts: [{ text: "Understood." }] },
                    { role: "user", parts: [{ text: userPrompt }] }
                ],
                generationConfig: generationConfig
            };
        } else if (endpoint === 'openrouter') {
            apiKey = getKey('openrouter-api-key');
            const model = getVal('openrouter-model-name') || ":free";
            if (!apiKey) throw new Error("OpenRouter API key is not provided.");
            url = `https://openrouter.ai/api/v1/chat/completions`;
            headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model,
                messages: [
                    { role: "user", content: `${globalPrompt}\n\n${userPrompt}` }
                ]
            };
            payload.response_format = { type: "json_object" };
        } else if (endpoint === 'custom') {
            apiKey = getKey('custom-api-key');
            const model = getVal('custom-model-name');
            const customUrl = getVal('custom-api-url');
            if (!customUrl) throw new Error("Custom API URL is not provided.");
            url = `${customUrl.replace(/\/$/, '')}/chat/completions`;
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
            payload = {
                model,
                messages: [
                    { role: "user", content: `${globalPrompt}\n\n${userPrompt}` }
                ]
            };
            payload.response_format = { type: "json_object" };
        } else {
            throw new Error("Invalid API endpoint.");
        }
        return { url, payload, headers };
    },

    _parseResponse(result) {
        const endpoint = document.getElementById('api-endpoint').value;
        try {
            if (endpoint === 'gemini') return JSON.parse(result.candidates[0].content.parts[0].text);
            if (endpoint === 'openrouter' || endpoint === 'custom') {
                let contentStr = result.choices[0].message.content.trim();
                const match = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(contentStr);
                if (match) contentStr = match[1];
                const content = JSON.parse(contentStr);
                return Array.isArray(content) ? content : content.wildcards || content.categories || content.items || [];
            }
            return [];
        } catch (e) {
            console.error("Failed to parse AI response:", result, e);
            throw new Error(`The AI returned a malformed response. Error: ${e.message}`);
        }
    },

    /**
     * Test the currently selected model with a realistic wildcard generation request.
     * Returns stats including response time, JSON support, and raw response for debugging.
     */
    async testModel(provider, apiKey, modelName, uiCallback) {
        const startTime = performance.now();

        // Realistic test prompt simulating actual usage
        const testPrompt = `You are a wildcard generator for Stable Diffusion prompts.
Generate exactly 5 unique wildcard items for the category "fantasy_creatures > mythical_beasts".
Existing items: dragon, phoenix, unicorn, griffin.
Custom instructions: "Focus on lesser-known mythological creatures."

Respond with ONLY a valid JSON array of strings, no other text.
Example: ["kirin", "thunderbird", "basilisk"]`;

        try {
            let url, headers, payload;

            if (provider === 'gemini') {
                url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
                headers = { 'Content-Type': 'application/json' };
                payload = {
                    contents: [{ parts: [{ text: testPrompt }] }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: { type: 'ARRAY', items: { type: 'STRING' } },
                        temperature: 0.7,
                        maxOutputTokens: 200
                    }
                };
            } else if (provider === 'openrouter') {
                url = 'https://openrouter.ai/api/v1/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': window.location.origin
                };
                payload = {
                    model: modelName,
                    messages: [{ role: 'user', content: testPrompt }],
                    response_format: { type: 'json_object' },
                    max_tokens: 200,
                    temperature: 0.7
                };
            } else { // custom
                const baseUrl = document.getElementById('custom-api-url')?.value || Config?.API_URL_CUSTOM || '';
                url = baseUrl.replace(/\/$/, '') + '/chat/completions';
                headers = {
                    'Content-Type': 'application/json',
                    ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
                };
                payload = {
                    model: modelName,
                    messages: [{ role: 'user', content: testPrompt }],
                    response_format: { type: 'json_object' },
                    max_tokens: 200,
                    temperature: 0.7
                };
            }

            const response = await fetch(url, {
                method: 'POST',
                headers,
                body: JSON.stringify(payload)
            });

            const duration = Math.round(performance.now() - startTime);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText.slice(0, 100)}`);
            }

            const result = await response.json();

            // Extract the response content
            const rawContent = result.choices?.[0]?.message?.content ||
                result.candidates?.[0]?.content?.parts?.[0]?.text || '';

            // Check if it's valid JSON array
            let parsedContent = null;
            let supportsJson = false;
            try {
                parsedContent = JSON.parse(rawContent);
                supportsJson = Array.isArray(parsedContent) && parsedContent.length > 0;
            } catch (e) {
                supportsJson = rawContent.includes('[') && rawContent.includes(']');
            }

            const stats = {
                responseTime: duration,
                modelName: modelName,
                supportsJson: supportsJson,
                provider: provider,
                rawResponse: rawContent,
                parsedCount: Array.isArray(parsedContent) ? parsedContent.length : 0,
                usage: result.usage || null
            };

            if (uiCallback) {
                uiCallback({ success: true, stats });
            }

            return stats;
        } catch (error) {
            const duration = Math.round(performance.now() - startTime);
            if (uiCallback) {
                uiCallback({ success: false, error: error.message, responseTime: duration });
            }
            throw error;
        }
    }
};
