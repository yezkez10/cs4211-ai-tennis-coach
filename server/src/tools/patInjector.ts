import * as fs from 'fs/promises';
import * as path from 'path';

export async function injectProbabilities(
    templatePath: string,
    probabilityMap: Record<string, Record<string, number>>,
    ): Promise<string> {
    
    let template = await fs.readFile(templatePath, 'utf-8');

    for (const [state, actionProbs] of Object.entries(probabilityMap)) {
        // find the specific action block in the template e.g. De_Ply1Serve = ...
        const blockRegex = new RegExp(`(${state}\\s*\\{)([^}]*)\\}`, 'g');
        const parts = template.split(blockRegex);

        if (parts.length > 2) {
            let blockContent = parts[2] ?? ''; // code inside the pcase block

            for (const [action, prob] of Object.entries(actionProbs)) {
                const safeProb = prob <= 0 ? 1 : Math.round(prob);

                const actionRegex = new RegExp(`99(\\s*:\\s*${action})`);
                blockContent = blockContent.replace(actionRegex, `${safeProb}$1`);
            }

            parts[2] = blockContent; // update the block content
            template = parts.join(''); // reassemble the template
        } else {
            console.warn(`State ${state} not found in template.`);
        }
    }
    return template;
}