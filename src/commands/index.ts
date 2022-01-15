import Command from '../client/Command';
import economy from './economy';
import levels from './levels';
import config from './config';
import util from './util';

const commandList: Command[] = [...economy, ...levels, ...config, ...util];
export default commandList;
