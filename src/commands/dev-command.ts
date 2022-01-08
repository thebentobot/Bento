import djs, { ApplicationCommandData, CommandInteraction, MessageEmbed, PermissionString } from 'discord.js';
import fileSize from 'filesize';
import os from 'os';
import typescript from 'typescript';

import { EventData } from '../models/internal-models';
import { MessageUtils, ShardUtils } from '../utils';
import { Command } from './command';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const TsConfig = require(`../../tsconfig.json`);

export class DevCommand implements Command {
	public metadata: ApplicationCommandData = {
		name: `dev`,
		description: `View developer info`,
	};
	public requireDev = true;
	public requireGuild = false;
	public requirePremium = false;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async execute(intr: CommandInteraction, _data: EventData): Promise<void> {
		const shardCount = intr.client.shard?.count ?? 1;
		let serverCount: number;
		if (intr.client.shard) {
			try {
				serverCount = await ShardUtils.serverCount(intr.client.shard);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				// SHARDING_IN_PROCESS: Shards are still being spawned.
				if (error.name.includes(`SHARDING_IN_PROCESS`)) {
					await MessageUtils.sendIntr(intr, `${intr.client.user?.username} is still starting up. Try again later.`);
					return;
				} else {
					throw error;
				}
			}
		} else {
			serverCount = intr.client.guilds.cache.size;
		}

		const memory = process.memoryUsage();
		const embed = new MessageEmbed()
			.setTitle(`${intr.client.user?.username} - Runtime info`)
			.setDescription(`**Versions**\n**Node.js**: ${process.version}\n**TypeScript**: v${typescript.version}\n**ECMAScript**: ${TsConfig.compilerOptions.target}\n**discord.js**: v${djs.version}\n\n**Stats**\n**Shards**: ${shardCount.toLocaleString()}\n**Servers**: ${serverCount.toLocaleString()} (${Math.round(serverCount / shardCount).toLocaleString()}/Shard)\n\n**Memory**\n**RSS**: ${fileSize(memory.rss)} (${serverCount > 0 ? fileSize(memory.rss / serverCount) : `N/A`}/Server)\n**Heap**: ${fileSize(memory.heapTotal)} (${serverCount > 0 ? fileSize(memory.heapTotal / serverCount) : `N/A`}/Server)\n**Used**: ${fileSize(memory.heapUsed)} (${serverCount > 0 ? fileSize(memory.heapUsed / serverCount) : `N/A`}/Server)\n\n**IDs**\n**Hostname**: ${os.hostname}\n**Shard ID**: ${(intr.guild?.shardId ?? 0).toString()}\n**Server ID**: ${intr.guild?.id ?? `N/A`}\n**Bot ID**: ${intr.client.user?.id}\n**User ID**: ${intr.user.id}`);
		await MessageUtils.sendIntr(
			intr,
			embed
		);
	}
}
