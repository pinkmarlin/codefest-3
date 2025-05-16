import { select, log, text } from '@clack/prompts';
import {readdir, readFile} from 'node:fs/promises';
import path from 'node:path';

/**
 * @returns Promise<Array<string>>
 */
async function getAllBashFilePaths(dir = process.cwd()) {
    const entries = await readdir(dir, { withFileTypes: true });
    const results = [];

    for (const entry of entries) {
        const fullPath = path.resolve(dir, entry.name);

        // Skip node_modules and hidden folders
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
            results.push(...await getAllBashFilePaths(fullPath));
        } else if (entry.isFile() && (fullPath.endsWith('.sh') || fullPath.endsWith('.bash'))) {
            results.push(fullPath);
        }
    }

    return results;
}

/**
 * @returns Promise<string>
 */
async function selectBashFile(prompt, placeholder, dir = process.cwd()) {

    const choices = await getAllBashFilePaths();
    let choice = '';

    if (!choices.length) {
        choice = '__custom';
    }

    let finalValue;


    if (choices.length) {
        const selected = await select({
            message: prompt,
            options: [
                ...choices.map(c => ({ label: c, value: c })),
                { label: '[Custom input]', value: '__custom' },
            ],
        });
        finalValue = selected;
        if (selected === '__custom') {
            const custom = await text({ message: prompt, placeholder });
            finalValue = custom;
        }
    } else {
        // No options must inline
        const custom = await text({ message: prompt, placeholder });
        finalValue = custom;
    }

    return finalValue;
}

export async function getCurl(prompt, placeholder, dir = process.cwd()) {
    const filepath = await selectBashFile(prompt, placeholder, dir);
    console.log('FILE PATH', filepath);
    const curl = (await readFile(filepath)).toString('utf-8');
    log.step(curl);
    return curl;
}