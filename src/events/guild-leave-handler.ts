import { Guild } from 'discord.js';
import { logs as Logs } from '../lang/logs.js';

import { Logger } from '../services/index.js';
import { prisma } from '../services/prisma.js';
import { EventHandler } from './event-handler.js';

export class GuildLeaveHandler implements EventHandler {
	public async process(guild: Guild): Promise<void> {
		Logger.info(Logs.info.guildLeft.replaceAll(`{GUILD_NAME}`, guild.name).replaceAll(`{GUILD_ID}`, guild.id));

		await prisma.guild.delete({
			where: {
				guildID: BigInt(guild.id)
			}});
	}
}
