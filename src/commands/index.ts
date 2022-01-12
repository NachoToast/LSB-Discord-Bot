import Command from '../client/Command';
import economy from './economy';
import ping from './ping';
import levels from './levels';
import { config, configure } from './config';

const commandList: Command[] = [...economy, ping, ...levels, config, configure];
export default commandList;
