import { CommandInteraction, Message, MessageEmbed, PermissionString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { prisma } from '../../services/prisma.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10.js';

export class PingCommand implements Command {
	public name = `ping`;
	public slashDescription = `Shows the latencies for ${config.botName}`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `ping`,
		description: this.slashDescription,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Shows the latency for ${config.botName}, the Discord API and ${config.botName}'s database in PostgreSQL`;
	public usage = `ping | /ping`;
	public website = `https://www.bentobot.xyz/commands#ping`;
	public category = `info`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const msgTimeStart = new Date().getTime();
		await InteractionUtils.send(intr, `🏓 Pinging...`);
		const msgTimeEnd = new Date().getTime();

		try {
			const dbTimeStart = new Date().getTime();
			await prisma.$queryRaw`select 1 + 1`;
			const dbTimeEnd = new Date().getTime();
			const dbTime = dbTimeEnd - dbTimeStart;

			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						intr.client.ws.ping,
					)} ms**\nPostgreSQL Latency is **${dbTime} ms**`,
				);

			await InteractionUtils.send(intr, embed);
			return;
		} catch (error) {
			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						intr.client.ws.ping,
					)} ms**\nPostgreSQL connection was not established, error: ${error}`,
				);

			await InteractionUtils.send(intr, embed);
			return;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const msgTimeStart = new Date().getTime();
		await MessageUtils.send(msg.channel, `🏓 Pinging...`);
		const msgTimeEnd = new Date().getTime();

		try {
			const dbTimeStart = new Date().getTime();
			await prisma.$queryRaw`select 1 + 1`;
			const dbTimeEnd = new Date().getTime();
			const dbTime = dbTimeEnd - dbTimeStart;

			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(msg.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						msg.client.ws.ping,
					)} ms**\nPostgreSQL Latency is **${dbTime} ms**`,
				);

			await MessageUtils.send(msg.channel, embed);
			return;
		} catch (error) {
			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(msg.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`🏓 Pong!`)
				.setDescription(
					`Bot Latency is **${Math.floor(msgTimeEnd - msgTimeStart)} ms** \nAPI Latency is **${Math.round(
						msg.client.ws.ping,
					)} ms**\nPostgreSQL connection was not established, error: ${error}`,
				);

			await MessageUtils.send(msg.channel, embed);
			return;
		}
	}
}
