import Command from '../client/Command';
import economy from './economy';
import ping from './ping';
import levels from './levels';
import config from './config';
import bing from './bing';
import list from './list';

const commandList: Command[] = [...economy, ping, ...levels, ...config, bing, list];
export default commandList;
