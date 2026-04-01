import { fetchPlayerStats } from 'tools/fetchPlayerStats';
import { buildPatModel } from './buildPatModel';
import { fetchMatchStats } from 'tools/fetchMatchStats';

export const tools = [buildPatModel, fetchPlayerStats, fetchMatchStats];
