import { fetchPlayerStats } from 'tools/fetchPlayerStats';
import { runPatModel } from 'tools/runPatModel';
import { fetchMatchStats } from 'tools/fetchMatchStats';

export const tools = [runPatModel, fetchPlayerStats, fetchMatchStats];
