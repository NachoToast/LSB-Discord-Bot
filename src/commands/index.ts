import Command from '../client/Command';
import economy from './economy';
import ping from './ping';
import levels from './levels';
import { config, configure } from './config';
import bing from './bing';
import list from './list';

const commandList: Command[] = [...economy, ping, ...levels, config, configure, bing, list];
export default commandList;
