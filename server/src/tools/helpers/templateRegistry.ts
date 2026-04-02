export type Handedness = 'RH' | 'LH'; // based on DB output

interface TemplateMap {
  [player1Hand: string]: {
    [player2Hand: string]: string;
  };
}

// Map the combinations to your physical file paths
export const PAT_TEMPLATES: TemplateMap = {
  'RH': {
    'RH': '../templates/Sample_RH_RH_4Regions.pcsp',
    'LH': '../templates/Sample_RH_LH_4Regions.pcsp',
  },
  'LH': {
    'RH': '../templates/Sample_LH_RH_4Regions.pcsp',
    'LH': '../templates/Sample_LH_LH_4Regions.pcsp',
  }
};

// Resolves template path dynamically using the hand property inside the outputted stats objects.
// Used in executePat.ts
export function resolveTemplatePath(p1Hand: string | null, p2Hand: string | null): string {
  const h1 = (p1Hand?.toUpperCase().startsWith('L') ? 'LH' : 'RH') as Handedness;
  const h2 = (p2Hand?.toUpperCase().startsWith('L') ? 'LH' : 'RH') as Handedness;

  const templatePath = PAT_TEMPLATES[h1]?.[h2];
  
  if (!templatePath) {
     throw new Error(`No template found for matchup: ${h1} vs ${h2}`);
  }
  
  return templatePath;
}