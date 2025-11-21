/// <reference types="expo-router/types" />

// NOTE: This file should not be edited and should be in your gitignore
declare module '*.css';
declare module '*.scss';

// This is to fix the error: Property 'context' does not exist on type 'NodeRequire'.
interface NodeRequire {
    context: (directory: string, useSubdirectories?: boolean, regExp?: RegExp) => {
        (key: string): any;
        keys(): string[];
    };
}