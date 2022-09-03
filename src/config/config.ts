/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { BitFieldResolvable, CacheWithLimitsOptions, Partials, GatewayIntentsString } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

interface IClient {
	caches: CacheWithLimitsOptions
	id: string
	token: string
	intents: BitFieldResolvable<GatewayIntentsString, number>
	partials: Partials[] | undefined
}

interface IConfig {
	botName: string,
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
		checkMutes: {
			schedule: string
			log: boolean
		}
		checkReminders: {
			schedule: string
			log: boolean
		}
		checkScheduledAnnouncements: {
			schedule: string
			log: boolean
		}
		checkTimedAnnouncements: {
			schedule: string
			log: boolean
		}
		deleteExpiredGfycatPosts: {
			schedule: string
			log: boolean
		}
		updateServerMemberCount: {
			schedule: string
			log: boolean
		}
	}
	rateLimiting: {
		commands: {
			amount: number,
			interval: number
		},
		buttons: {
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
	botName: process.env.botName as string,
	developers: [`232584569289703424`],
	client: {
		id: process.env.botId as string,
		token: process.env.token as string,
		intents: [`Guilds`, `GuildMessages`, `GuildMessageReactions`, `DirectMessages`, `DirectMessageReactions`],
		partials: [Partials.Message, Partials.Channel, Partials.Reaction],
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
		port: 4422,
		secret: process.env.apiToken as string
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
			token: process.env.clusterToken as string
		}
	},
	jobs: {
		updateServerCount: {
			schedule: `0 */10 * * * *`,
			log: true
		},
		checkMutes: {
			schedule: `* * * * *`,
			log: true
		},
		checkReminders: {
			schedule: `* * * * *`,
			log: true
		},
		checkScheduledAnnouncements: {
			schedule: `* * * * *`,
			log: true
		},
		checkTimedAnnouncements: {
			schedule: `* * * * *`,
			log: true
		},
		deleteExpiredGfycatPosts: {
			schedule: `0 */12 * * *`,
			log: true
		},
		updateServerMemberCount: {
			schedule: `0 */3 * * *`,
			log: true
		}
	},
	rateLimiting: {
		commands: {
			amount: 10,
			interval: 30
		},
		buttons: {
			amount: 30,
			interval: 10
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
