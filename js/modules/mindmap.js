/**
 * Mind Elixir Mindmap View Module
 * Provides an alternative visualization for the wildcards hierarchy as an interactive mindmap.
 */
import { State } from '../state.js';
import { Config, saveConfig } from '../config.js';
import { UI } from '../ui.js';

// View mode constants
const VIEW_MODES = {
    LIST: 'list',
    MINDMAP: 'mindmap',
    DUAL: 'dual'
};

const Mindmap = {
    instance: null,
    dualInstance: null,
    currentView: VIEW_MODES.LIST,
    isInitialized: false,
    _syncLock: false, // Prevent infinite sync loops
    _MindElixir: null, // Cached MindElixir module reference

    /**
     * Load Mind Elixir library dynamically
     * @returns {Promise<typeof MindElixir>}
     */
    async loadMindElixir() {
        if (this._MindElixir) {
            return this._MindElixir;
        }

        try {
            const module = await import('https://cdn.jsdelivr.net/npm/mind-elixir/dist/MindElixir.js');
            this._MindElixir = module.default || module;
            console.log('Mind Elixir loaded successfully');
            return this._MindElixir;
        } catch (error) {
            console.error('Failed to load Mind Elixir:', error);
            UI.showToast('Failed to load mindmap library', 'error');
            return null;
        }
    },

    /**
     * Transform State.wildcards → Mind Elixir format
     * @param {Object} wildcards - The wildcards object from State
     * @returns {Object} Mind Elixir compatible data structure
     */
    transformToMindElixir(wildcards) {
        let nodeId = 0;
        const generateId = (prefix) => `${prefix}-${++nodeId}`;

        /**
         * Recursively build Mind Elixir node from wildcards data
         * @param {string} name - Node name
         * @param {Object} data - Node data (can have instruction, wildcards array, or subcategories)
         * @param {string} parentPath - Path string for ID generation
         * @returns {Object} Mind Elixir node
         */
        const buildNode = (name, data, parentPath = '') => {
            const path = parentPath ? `${parentPath}/${name}` : name;
            const node = {
                id: generateId(path),
                topic: name,
                tags: [],
                children: [],
                // Store original path for sync back
                data: { path: path.split('/') }
            };

            // Add instruction as a tag if present
            if (data.instruction && typeof data.instruction === 'string') {
                node.tags.push(data.instruction.substring(0, 50) + (data.instruction.length > 50 ? '...' : ''));
            }

            // Process wildcards array (leaf items)
            if (data.wildcards && Array.isArray(data.wildcards)) {
                data.wildcards.forEach((wildcard, index) => {
                    const wildcardText = typeof wildcard === 'string' ? wildcard : wildcard.name || String(wildcard);
                    node.children.push({
                        id: generateId(`${path}/w${index}`),
                        topic: wildcardText,
                        data: {
                            path: [...path.split('/'), 'wildcards', index],
                            isWildcard: true
                        },
                        style: {
                            background: 'var(--chip-bg, #374151)',
                            color: 'var(--chip-text, #e5e7eb)',
                            fontSize: '12'
                        }
                    });
                });
            }

            // Recursively process subcategories
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'instruction' && key !== 'wildcards' && typeof value === 'object' && value !== null) {
                    node.children.push(buildNode(key, value, path));
                }
            });

            return node;
        };

        // Build root node with all top-level categories
        const rootNode = {
            id: 'root',
            topic: '🎯 Wildcards',
            root: true,
            children: Object.entries(wildcards).map(([name, data]) => buildNode(name, data))
        };

        return {
            nodeData: rootNode
        };
    },

    /**
     * Transform Mind Elixir data back to State.wildcards format
     * @param {Object} mindData - Mind Elixir export data
     * @returns {Object} State.wildcards compatible structure
     */
    transformFromMindElixir(mindData) {
        const buildWildcards = (node) => {
            const result = {};

            if (!node.children || node.children.length === 0) {
                return result;
            }

            // Separate wildcard items from subcategories
            const wildcardItems = [];
            const subcategories = {};

            node.children.forEach(child => {
                if (child.data?.isWildcard) {
                    wildcardItems.push(child.topic);
                } else {
                    // It's a subcategory
                    const childResult = buildWildcards(child);
                    if (Object.keys(childResult).length > 0 || child.children?.length > 0) {
                        subcategories[child.topic] = childResult;
                    } else {
                        // Empty category
                        subcategories[child.topic] = {};
                    }
                    // Check for instruction in tags
                    if (child.tags && child.tags.length > 0) {
                        subcategories[child.topic].instruction = child.tags[0];
                    }
                }
            });

            // Add wildcards if any
            if (wildcardItems.length > 0) {
                result.wildcards = wildcardItems;
            }

            // Merge subcategories
            Object.assign(result, subcategories);

            return result;
        };

        // Start from root's children (top-level categories)
        const wildcards = {};
        if (mindData.nodeData && mindData.nodeData.children) {
            mindData.nodeData.children.forEach(categoryNode => {
                wildcards[categoryNode.topic] = buildWildcards(categoryNode);
                // Add instruction if present
                if (categoryNode.tags && categoryNode.tags.length > 0) {
                    wildcards[categoryNode.topic].instruction = categoryNode.tags[0];
                }
            });
        }

        return wildcards;
    },

    /**
     * Initialize Mind Elixir instance
     * @param {string} containerSelector - CSS selector for container element
     */
    async init(containerSelector = '#mindmap-container') {
        // Load MindElixir dynamically
        const MindElixir = await this.loadMindElixir();
        if (!MindElixir) {
            return;
        }

        const container = document.querySelector(containerSelector);
        if (!container) {
            console.warn(`Mindmap container not found: ${containerSelector}`);
            return;
        }

        // Clear any existing instance
        if (containerSelector === '#mindmap-container' && this.instance) {
            this.instance.destroy?.();
            this.instance = null;
        }

        const options = {
            el: container,
            direction: MindElixir.SIDE,
            draggable: true,
            toolBar: true,
            nodeMenu: true,
            keypress: true,
            locale: 'en',
            allowUndo: true,
            overflowHidden: false,
            mainLinkStyle: 2,
            contextMenu: {
                focus: true,
                link: false,
                extend: [
                    {
                        name: '✨ Generate More',
                        onclick: (data) => this.handleGenerateAction(data)
                    },
                    {
                        name: '💡 Suggest Children',
                        onclick: (data) => this.handleSuggestAction(data)
                    }
                ]
            },
            before: {
                removeNode: async (el, obj) => {
                    // Confirm deletion for categories (not wildcards)
                    if (!obj.data?.isWildcard) {
                        return confirm(`Delete "${obj.topic}" and all its contents?`);
                    }
                    return true;
                }
            }
        };

        const instance = new MindElixir(options);
        const data = this.transformToMindElixir(State._rawData.wildcards || {});
        instance.init(data);

        // Store instance
        if (containerSelector === '#mindmap-container') {
            this.instance = instance;
        } else if (containerSelector === '#dual-mindmap') {
            this.dualInstance = instance;
        }

        // Setup event listeners for this instance
        this.setupEventListeners(instance, containerSelector);

        // Apply initial theme
        this.syncTheme(instance);

        this.isInitialized = true;
        console.log('Mind Elixir initialized:', containerSelector);
    },

    /**
     * Setup bidirectional event listeners
     * @param {MindElixir} instance - Mind Elixir instance
     * @param {string} containerSelector - Container selector for context
     */
    setupEventListeners(instance, containerSelector) {
        // Mind Elixir → State sync
        instance.bus.addListener('operation', (operation) => {
            if (this._syncLock) return;
            this.handleMindmapOperation(operation, instance);
        });

        // Selection sync for dual pane mode
        instance.bus.addListener('selectNodes', (nodes) => {
            if (this.currentView === VIEW_MODES.DUAL && nodes.length > 0) {
                this.syncSelectionToList(nodes[0]);
            }
        });

        // State → Mind Elixir sync (listen once per module, not per instance)
        if (!this._stateListenersSetup) {
            State.events.addEventListener('state-updated', () => {
                this.refresh();
            });
            State.events.addEventListener('state-reset', () => {
                this.refresh();
            });
            this._stateListenersSetup = true;
        }
    },

    /**
     * Handle Mind Elixir operations and sync to State
     * @param {Object} operation - Operation object from Mind Elixir
     * @param {MindElixir} instance - The Mind Elixir instance
     */
    handleMindmapOperation(operation, instance) {
        console.log('Mindmap operation:', operation.name, operation.obj);

        this._syncLock = true;

        try {
            // For now, just do a full sync after any operation
            // More granular syncing can be implemented later for better performance
            const data = instance.getData();
            const newWildcards = this.transformFromMindElixir(data);

            // Update State with new wildcards structure
            Object.keys(State._rawData.wildcards).forEach(key => {
                delete State._rawData.wildcards[key];
            });
            Object.assign(State._rawData.wildcards, newWildcards);

            State.saveStateToHistory();
            State._saveToLocalStorage();

            // Refresh UI if in dual mode
            if (this.currentView === VIEW_MODES.DUAL) {
                UI.renderCategories(State._rawData.wildcards);
            }
        } catch (error) {
            console.error('Error syncing mindmap to state:', error);
            UI.showToast('Failed to sync changes', 'error');
        } finally {
            this._syncLock = false;
        }
    },

    /**
     * Refresh mindmap from current State
     */
    refresh() {
        if (this._syncLock) return;

        if (this.instance && (this.currentView === VIEW_MODES.MINDMAP || this.currentView === VIEW_MODES.DUAL)) {
            try {
                const data = this.transformToMindElixir(State._rawData.wildcards || {});
                this.instance.refresh(data);
            } catch (error) {
                console.error('Error refreshing mindmap:', error);
            }
        }

        if (this.dualInstance && this.currentView === VIEW_MODES.DUAL) {
            try {
                const data = this.transformToMindElixir(State._rawData.wildcards || {});
                this.dualInstance.refresh(data);
            } catch (error) {
                console.error('Error refreshing dual mindmap:', error);
            }
        }
    },

    /**
     * Change view mode
     * @param {string} mode - 'list', 'mindmap', or 'dual'
     */
    async setView(mode) {
        if (!Object.values(VIEW_MODES).includes(mode)) {
            console.warn('Invalid view mode:', mode);
            return;
        }

        this.currentView = mode;

        // Save preference
        Config.PREFERRED_VIEW = mode;
        saveConfig();

        const listContainer = document.getElementById('wildcard-container');
        const mindmapContainer = document.getElementById('mindmap-container');
        const dualContainer = document.getElementById('dual-container');
        const searchSection = document.querySelector('.mt-6.text-left.max-w-4xl');
        const statsBar = document.getElementById('stats-bar');

        // Hide all containers first
        listContainer?.classList.add('hidden');
        mindmapContainer?.classList.add('hidden');
        dualContainer?.classList.add('hidden');

        // Show appropriate container(s)
        switch (mode) {
            case VIEW_MODES.LIST:
                listContainer?.classList.remove('hidden');
                searchSection?.classList.remove('hidden');
                statsBar?.classList.remove('hidden');
                break;

            case VIEW_MODES.MINDMAP:
                mindmapContainer?.classList.remove('hidden');
                searchSection?.classList.add('hidden');
                statsBar?.classList.add('hidden');

                // Initialize if not already done
                if (!this.instance) {
                    await this.init('#mindmap-container');
                } else {
                    this.refresh();
                    this.instance.toCenter();
                }
                break;

            case VIEW_MODES.DUAL:
                dualContainer?.classList.remove('hidden');
                searchSection?.classList.remove('hidden');
                statsBar?.classList.remove('hidden');

                // Clone list into dual-list
                await this.initDualPane();
                break;
        }

        // Update button states
        document.querySelectorAll('.view-mode-selector button').forEach(btn => {
            btn.classList.toggle('active', btn.id === `view-${mode}`);
        });

        UI.showToast(`Switched to ${mode} view`, 'success');
    },

    /**
     * Initialize dual pane mode
     */
    async initDualPane() {
        const dualList = document.getElementById('dual-list');
        const listContainer = document.getElementById('wildcard-container');

        if (dualList && listContainer) {
            // Clone the list content
            dualList.innerHTML = listContainer.innerHTML;
        }

        // Initialize mindmap in dual container
        if (!this.dualInstance) {
            const dualMindmap = document.getElementById('dual-mindmap');
            if (dualMindmap) {
                await this.init('#dual-mindmap');
            }
        } else {
            this.refresh();
        }
    },

    /**
     * Sync selection from mindmap to list view (for dual pane)
     * @param {Object} node - Selected Mind Elixir node
     */
    syncSelectionToList(node) {
        if (!node.data?.path) return;

        const path = node.data.path;
        const dualList = document.getElementById('dual-list');
        if (!dualList) return;

        // Remove previous highlights
        dualList.querySelectorAll('.dual-highlight').forEach(el => {
            el.classList.remove('dual-highlight');
        });

        // Find and highlight the corresponding element
        // For categories, look for details with matching data-path
        const categoryName = path[0];
        const targetCategory = dualList.querySelector(`details[data-path="${categoryName}"]`);

        if (targetCategory) {
            targetCategory.classList.add('dual-highlight');
            targetCategory.scrollIntoView({ behavior: 'smooth', block: 'center' });

            // If it's a wildcard, also try to highlight the chip
            if (node.data.isWildcard && path.length > 2) {
                // Find chip container and highlight specific chip
                // This would require more complex DOM traversal
            }
        }
    },

    /**
     * Sync theme between app and Mind Elixir
     * @param {MindElixir} instance - Optional specific instance else uses this.instance
     */
    syncTheme(instance = null) {
        const targetInstance = instance || this.instance;
        if (!targetInstance) return;

        const isDark = document.documentElement.classList.contains('dark');

        const theme = isDark ? {
            name: 'Dark',
            palette: ['#848FA0', '#748BE9', '#D2F9FE', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
            cssVar: {
                '--main-color': '#e5e7eb',
                '--main-bgcolor': '#1f2937',
                '--color': '#d1d5db',
                '--bgcolor': '#111827',
                '--panel-color': '229, 231, 235',
                '--panel-bgcolor': '31, 41, 55',
            }
        } : {
            name: 'Light',
            palette: ['#848FA0', '#748BE9', '#A8E6CF', '#4145A5', '#789AFA', '#706CF4', '#EF987F', '#775DD5', '#FCEECF', '#DA7FBC'],
            cssVar: {
                '--main-color': '#1f2937',
                '--main-bgcolor': '#ffffff',
                '--color': '#374151',
                '--bgcolor': '#f3f4f6',
                '--panel-color': '31, 41, 55',
                '--panel-bgcolor': '255, 255, 255',
            }
        };

        try {
            targetInstance.changeTheme(theme);
        } catch (error) {
            console.warn('Could not apply theme to Mind Elixir:', error);
        }
    },

    /**
     * Handle AI Generate action from context menu
     * @param {Object} nodeData - Node data from context menu
     */
    handleGenerateAction(nodeData) {
        if (!nodeData.data?.path) {
            UI.showToast('Cannot generate for this node', 'error');
            return;
        }

        const path = nodeData.data.path;

        // Dispatch event for App to handle
        const event = new CustomEvent('mindmap-generate', {
            detail: { path, nodeTopic: nodeData.topic }
        });
        document.dispatchEvent(event);

        UI.showToast(`Generating wildcards for "${nodeData.topic}"...`, 'info');
    },

    /**
     * Handle AI Suggest action from context menu
     * @param {Object} nodeData - Node data from context menu
     */
    handleSuggestAction(nodeData) {
        if (!nodeData.data?.path) {
            UI.showToast('Cannot suggest for this node', 'error');
            return;
        }

        const path = nodeData.data.path;

        // Dispatch event for App to handle
        const event = new CustomEvent('mindmap-suggest', {
            detail: { path, nodeTopic: nodeData.topic }
        });
        document.dispatchEvent(event);

        UI.showToast(`Getting suggestions for "${nodeData.topic}"...`, 'info');
    },

    /**
     * Cleanup on destroy
     */
    destroy() {
        if (this.instance) {
            this.instance.destroy?.();
            this.instance = null;
        }
        if (this.dualInstance) {
            this.dualInstance.destroy?.();
            this.dualInstance = null;
        }
        this.isInitialized = false;
    }
};

export { Mindmap, VIEW_MODES };
