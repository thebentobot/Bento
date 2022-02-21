import { ShardingManagerMode } from "discord.js";

interface IDebug {
	skip: {
		checkPerms: boolean
	}
	override: {
		shardMode: {
			enabled: boolean
			value: ShardingManagerMode | undefined
		}
	}
	dummyMode: {
		enabled: boolean
		whitelist: string[]
	}
}

export const debug: IDebug = {
	skip: {
		checkPerms: false
	},
	override: {
		shardMode: {
			enabled: false,
			value: `process`
		}
	},
	dummyMode: {
		enabled: false,
		whitelist: [`232584569289703424`]
	}
};