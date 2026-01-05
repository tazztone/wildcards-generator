/**
 * Global type augmentations for the Wildcards Generator project.
 * These augment the browser's Window interface to include properties
 * that are dynamically attached at runtime for testing purposes.
 */

// Declare the YAML CDN module to suppress TypeScript import errors
declare module 'https://cdn.jsdelivr.net/npm/yaml@2.8.2/browser/index.js' {
    const YAML: {
        stringify: (value: any, options?: any) => string;
        parse: (text: string, options?: any) => any;
        parseDocument: (text: string) => { contents: any; errors?: any[] };
    };
    export default YAML;
}

// Augment the Window interface with globally attached properties
interface Window {
    JSZip: new () => {
        file: (name: string, data: string | Blob) => void;
        generateAsync: (options: { type: string }) => Promise<Blob>;
    };
    Config?: Record<string, any>;
    ImportExport?: Record<string, any>;
    Api?: {
        testConnection: (provider: string, filters: any, apiKey: string) => Promise<any[]>;
        [key: string]: any;
    };
}
