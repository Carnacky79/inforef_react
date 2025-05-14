import { env } from './env';
import { MockBlueiotClient } from './mockBlueiotClient';
import { RealBlueiotClient } from './realBlueiotClient';

export const BlueiotClient = env.useMock
	? MockBlueiotClient
	: RealBlueiotClient;
