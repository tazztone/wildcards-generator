# Enhancement Plan for AI-Powered Wildcard Generator

This document outlines a 10-point plan for enhancing the AI-Powered Wildcard Generator tool, based on user feedback and analysis of the current implementation in `wildcards.html`. The plan prioritizes key features requested by the user and includes additional improvements to ensure a comprehensive upgrade to the tool's functionality and user experience.

## 1. Use of `LLM_KEY` Environment Variable for API Key Management
- **Objective**: Replace the hardcoded empty API key with a secure method using an `LLM_KEY` environment variable.
- **Implementation**: Integrate a build-time process or a minimal backend proxy to inject the environment variable into the client-side code. For static hosting, a configuration script or build step can embed the key securely. If hosted on a server, a backend endpoint will provide the key to the frontend, ensuring it is not exposed in the source code.

## 2. Support for Custom API Endpoints
- **Objective**: Allow users to specify custom API endpoints for different LLM providers, including OpenRouter and Ollama for local model support.
- **Implementation**: Add a UI input field in the settings or header section for users to enter a custom API endpoint URL. Include a dropdown with predefined options (Gemini, OpenRouter, Ollama) that can be overridden with a custom URL. Adjust the API request logic in the code to use the selected endpoint dynamically.

## 3. Confirm Autosave Functionality
- **Objective**: Ensure the application always autosaves its state to prevent data loss.
- **Implementation**: Verify that the current debounced autosave mechanism to localStorage is functioning as intended. No changes are needed unless the user specifies a different behavior or storage method.

## 4. Enhance Reset Button
- **Objective**: Review the existing red "Reset to Defaults" button and potentially enhance its visibility or behavior.
- **Implementation**: Confirm with the user if a stylistic change (e.g., more prominent red color) or additional confirmation steps are desired. If no changes are requested, maintain the current implementation which already includes a confirmation dialog.

## 5. Ensure Dark Mode by Default
- **Objective**: Confirm that the UI uses dark mode as the default theme.
- **Implementation**: The current design already uses a dark theme with `bg-gray-900` and corresponding dark elements. Verify with the user if this meets their expectation or if a light/dark mode toggle or further customization is needed. No immediate changes unless specified.

## 6. Add Export/Import Functionality for Application State
- **Objective**: Enable users to export the entire application state (including global prompt and custom instructions) and import it later for backup or sharing.
- **Implementation**: Add UI buttons for exporting the state as a JSON file and importing a previously saved state, updating the localStorage accordingly. Ensure the import function validates the data structure before overwriting the current state.

## 7. Implement Search and Filter Functionality
- **Objective**: Improve usability by allowing users to search for specific wildcards or filter by categories/sub-categories.
- **Implementation**: Add a search bar at the top of the UI to filter wildcards across all categories. Implement a filter dropdown to show/hide specific categories or sub-categories, dynamically updating the UI based on user input.

## 8. Add Undo/Redo Functionality
- **Objective**: Prevent accidental data loss by allowing users to undo actions like deleting wildcards or resetting to defaults.
- **Implementation**: Maintain a history stack of state changes in localStorage or memory, with UI buttons to undo or redo actions. Limit the history to a reasonable number of steps to manage storage size, ensuring key actions like edits and deletions are reversible.

## 9. Enable Batch Operations for Wildcard Management
- **Objective**: Allow users to perform actions on multiple wildcards simultaneously, such as deletion or moving between categories.
- **Implementation**: Add checkbox selection to wildcard chips for batch operations. Include UI controls to delete selected wildcards or move them to a different sub-category, updating the state and UI accordingly.

## 10. Include In-App Documentation or Help Section
- **Objective**: Provide guidance within the app to help users understand how to use the tool and craft effective prompts.
- **Implementation**: Add a help icon or button in the header that opens a modal with documentation on using the tool, including tips for custom instructions and API endpoint setup. Ensure the content is concise yet comprehensive, covering all major functionalities.

## Next Steps
This plan will be implemented in phases, starting with the user-prioritized features (points 1 and 2). Each enhancement will be coded into `wildcards.html` as a monolithic file per the user's instructions in `.clinerules`. User feedback will be sought after key implementations to ensure alignment with expectations. Once all features are integrated, a final review will confirm the tool's enhanced functionality and usability.
