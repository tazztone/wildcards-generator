import gradio as gr
import yaml
import json
import re
import urllib.request
import urllib.error
import tempfile

class Api:
    def _prepare_request(self, provider, api_keys, models, custom_url, global_prompt, user_prompt, generation_config=None):
        headers = {'Content-Type': 'application/json'}
        payload = {}
        url = ""
        if provider == 'gemini':
            api_key = api_keys.get('gemini')
            model = models.get('gemini', 'gemini-1.5-flash')
            if not api_key: raise ValueError("Gemini API key not provided.")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
            payload = { "contents": [ {"role": "user", "parts": [{"text": global_prompt}]}, {"role": "model", "parts": [{"text": "Understood."}]}, {"role": "user", "parts": [{"text": user_prompt}]} ], "generationConfig": generation_config or {} }
        elif provider == 'openrouter':
            api_key = api_keys.get('openrouter')
            model = models.get('openrouter', ':free')
            if not api_key: raise ValueError("OpenRouter API key not provided.")
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers['Authorization'] = f"Bearer {api_key}"
            payload = { "model": model, "messages": [{"role": "user", "content": f"{global_prompt}\n\n{user_prompt}"}], "response_format": {"type": "json_object"} }
        elif provider == 'custom':
            api_key = api_keys.get('custom')
            model = models.get('custom', '')
            if not custom_url: raise ValueError("Custom API URL is not provided.")
            url = f"{custom_url.rstrip('/')}/chat/completions"
            if api_key: headers['Authorization'] = f"Bearer {api_key}"
            payload = { "model": model, "messages": [{"role": "user", "content": f"{global_prompt}\n\n{user_prompt}"}], "response_format": {"type": "json_object"} }
        else:
            raise ValueError(f"Provider '{provider}' is not implemented.")
        return url, headers, payload

    def _parse_response(self, provider, response_body):
        response_json = json.loads(response_body)
        if provider == 'gemini':
            if not response_json.get('candidates'): raise Exception("Invalid response from Gemini API.")
            part_text = response_json['candidates'][0]['content']['parts'][0]['text']
            return json.loads(part_text)
        elif provider in ['openrouter', 'custom']:
            if not response_json.get('choices'): raise Exception(f"Invalid response from {provider} API.")
            content_str = response_json['choices'][0]['message']['content'].strip()
            match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', content_str)
            if match: content_str = match.group(1)
            content = json.loads(content_str)
            if isinstance(content, list): return content
            return content.get('wildcards', content.get('categories', content.get('items', [])))
        return []

    def _make_request(self, url, data, headers, timeout=30):
        req = urllib.request.Request(url, data=data, headers=headers, method='POST')
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status != 200: raise urllib.error.HTTPError(url, response.status, "API request failed", response.headers, response.fp)
                return response.read().decode('utf-8')
        except urllib.error.HTTPError as e:
            raise Exception(f"API request failed with status {e.code}: {e.read().decode('utf-8')}")
        except Exception as e:
            raise Exception(f"An error occurred during API call: {e}")

    def generate_wildcards(self, provider, api_keys, models, custom_url, global_prompt, path, words, instructions):
        user_prompt = f"Category Path: '{path.replace('/', ' > ')}'\nExisting Wildcards: {', '.join(words[:50])}\nCustom Instructions: \"{instructions.strip()}\""
        config = {"responseMimeType": "application/json", "responseSchema": {"type": "ARRAY", "items": {"type": "STRING"}}}
        url, headers, payload = self._prepare_request(provider, api_keys, models, custom_url, global_prompt, user_prompt, config)
        response_body = self._make_request(url, json.dumps(payload).encode('utf-8'), headers)
        return self._parse_response(provider, response_body)

    def suggest_items(self, provider, api_keys, models, custom_url, suggest_prompt, parent_path, sibling_structure):
        global_prompt = suggest_prompt.replace('{parentPath}', parent_path.replace('/', ' > ').replace('_', ' '))
        user_prompt = f"For context, here are the existing sibling items:\n{json.dumps(sibling_structure, indent=2)}\n\nPlease provide new suggestions for the '{parent_path}' category."
        config = {
            "responseMimeType": "application/json",
            "responseSchema": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"name": {"type": "STRING"}, "instruction": {"type": "STRING"}}, "required": ["name", "instruction"]}}
        }
        url, headers, payload = self._prepare_request(provider, api_keys, models, custom_url, global_prompt, user_prompt, config)
        response_body = self._make_request(url, json.dumps(payload).encode('utf-8'), headers, timeout=45)
        return self._parse_response(provider, response_body)

    def fetch_models(self, provider, api_key="", custom_url=""):
        # ... (same as before)
        pass
    def test_connection(self, provider, api_key="", custom_url=""):
        # ... (same as before)
        pass

# ... (data loading and helpers) ...
def process_yaml_node(node):
    if isinstance(node, list): return {'instruction': '', 'wildcards': sorted([str(v) for v in node])}
    if isinstance(node, dict): return {k: process_yaml_node(v) for k, v in node.items()}
    if node is None: return {}
    return {'instruction': '', 'wildcards': [str(node)]}
def load_initial_data():
    with open('initial-data.yaml', 'r', encoding='utf-8') as f:
        yaml_data = yaml.safe_load(f)
    return {k: process_yaml_node(v) for k, v in yaml_data.items()}
def load_config():
    with open('config.json', 'r') as f:
        return json.load(f)
def get_all_paths(wildcard_data, parent_path=""):
    paths = []
    for key, value in wildcard_data.items():
        current_path = f"{parent_path}/{key}" if parent_path else key
        if 'wildcards' in value and isinstance(value['wildcards'], list): paths.append(current_path)
        elif isinstance(value, dict) and value: paths.extend(get_all_paths(value, current_path))
    return sorted(paths)
def get_data_by_path(path, state):
    if not path: return None
    parts = path.split('/')
    data = state['wildcards']
    for part in parts: data = data.get(part, {})
    return data

with gr.Blocks(css="wildcards.css") as demo:
    config = load_config()
    initial_data = load_initial_data()
    api = Api()
    initial_paths = get_all_paths(initial_data)

    app_state = gr.State({
        "config": config, "wildcards": initial_data, "history": [], "history_index": -1,
        "api_keys": {"gemini": "", "openrouter": "", "custom": ""},
        "models": {"gemini": config.get('MODEL_NAME_GEMINI'), "openrouter": config.get('MODEL_NAME_OPENROUTER'), "custom": config.get('MODEL_NAME_CUSTOM')},
        "custom_url": config.get('API_URL_CUSTOM'), "active_provider": "gemini"
    })

    gr.Markdown("# Wildcard Generator (Gradio Port)")

    # ... (Settings UI) ...

    with gr.Accordion("Suggest", open=False):
        suggest_btn = gr.Button("Suggest New Items for Selected Category")
        suggestions_output = gr.JSON(label="Suggestions")

    # ... (rest of UI) ...

    # --- Event Handlers ---
    def get_sibling_structure(path, state):
        if not path or '/' not in path:
            return {k: {} for k in state['wildcards'].keys()}
        parent_path = '/'.join(path.split('/')[:-1])
        parent_node = get_data_by_path(parent_path, state)
        return {k: {} for k in parent_node.keys()}

    def suggest_items_handler(path, state):
        if not path:
            gr.Warning("Please select a category first.")
            return None
        try:
            gr.Info(f"Requesting suggestions for {path}...")
            provider = state.get('active_provider', 'gemini')
            prompt = state['config'].get('DEFAULT_SUGGEST_ITEM_PROMPT')
            siblings = get_sibling_structure(path, state)
            suggestions = api.suggest_items(
                provider, state['api_keys'], state['models'], state['custom_url'],
                prompt, path, siblings
            )
            gr.Info("Suggestions received.")
            return suggestions
        except Exception as e:
            gr.Error(f"Suggestion failed: {e}")
            return None

    suggest_btn.click(
        fn=suggest_items_handler,
        inputs=[category_path_dropdown, app_state],
        outputs=[suggestions_output]
    )

if __name__ == "__main__":
    demo.launch()
