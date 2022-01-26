/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { BitFieldResolvable, CacheWithLimitsOptions, IntentsString, PartialTypes } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

interface IClient {
	caches: CacheWithLimitsOptions
	id: string
	token: string
	intents: BitFieldResolvable<IntentsString, number>
	partials: PartialTypes[] | undefined
}

interface IConfig {
	developers: string[]
	client: IClient
	api: { port: number, secret: string}
	sharding: { spawnDelay: number, spawnTimeout: number, serversPerShard: number }
	clustering: {
		enabled: boolean
		shardCount: number
		callbackUrl: string
		masterApi: {
			url: string
			token: string
		}
	}
	jobs: {
		updateServerCount: {
			schedule: string
			log: boolean
		}
	}
	rateLimiting: {
		commands: {
			amount: number,
			interval: number
		},
		triggers: {
			amount: number,
			interval: number
		},
		reactions: {
			amount: number,
			interval: number
		}
	},
	logging: {
		pretty: boolean,
		rateLimit: {
			minTimeout: number
		}
	}
}

export const config: IConfig = {
	developers: [`232584569289703424`],
	client: {
		id: process.env.botId as string,
		token: process.env.botToken as string,
		intents: [`GUILDS`, `GUILD_MESSAGES`, `GUILD_MESSAGE_REACTIONS`, `DIRECT_MESSAGES`, `DIRECT_MESSAGE_REACTIONS`],
		partials: [`MESSAGE`, `CHANNEL`, `REACTION`],
		caches: {
			BaseGuildEmojiManager: 0,
			GuildBanManager: 0,
			GuildInviteManager: 0,
			GuildStickerManager: 0,
			MessageManager: 0,
			PresenceManager: 0,
			StageInstanceManager: 0,
			ThreadManager: 0,
			ThreadMemberManager: 0,
			VoiceStateManager: 0
		}
	},
	api: {
		port: 8080,
		secret: `00000000-0000-0000-0000-000000000000`
	},
	sharding: {
		spawnDelay: 5,
		spawnTimeout: 300,
		serversPerShard: 1000
	},
	clustering: {
		enabled: false,
		shardCount: 16,
		callbackUrl: `http://localhost:8080/`,
		masterApi: {
			url: `http://localhost:5000/`,
			token: `00000000-0000-0000-0000-000000000000`
		}
	},
	jobs: {
		updateServerCount: {
			schedule: `0 */10 * * * *`,
			log: false
		}
	},
	rateLimiting: {
		commands: {
			amount: 10,
			interval: 30
		},
		triggers: {
			amount: 10,
			interval: 30
		},
		reactions: {
			amount: 10,
			interval: 30
		}
	},
	logging: {
		pretty: true,
		rateLimit: {
			minTimeout: 30
		}
	}
};
