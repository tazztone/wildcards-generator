/**
 * Global type augmentations for the Wildcards Generator project.
 * These augment the browser's Window interface to include properties
 * that are dynamically attached at runtime for testing purposes.
 */
interface Window {
    Config?: Record<string, any>;
    ImportExport?: Record<string, any>;
}
