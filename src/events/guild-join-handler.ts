import { EmbedAuthorData, Guild, EmbedBuilder, EmbedFooterData } from 'discord.js';
import { Logger } from '../services/index.js';
import { prisma } from '../services/prisma.js';
import { ClientUtils, MessageUtils, stylingUtils } from '../utils/index.js';
import { EventHandler } from './event-handler.js';
import * as dotenv from 'dotenv';
import { logs as Logs } from '../lang/logs.js';
dotenv.config();

export class GuildJoinHandler implements EventHandler {
	public async process(guild: Guild): Promise<void> {
		Logger.info(Logs.info.guildJoined.replaceAll(`{GUILD_NAME}`, guild.name).replaceAll(`{GUILD_ID}`, guild.id));

		// adds guild to the db
		await prisma.$transaction([
			prisma.guild.create({
				data: {
					guildID: BigInt(guild.id),
					guildName: guild.name,
					icon: guild.iconURL({ extension: `png`, forceStatic: false, size: 1024 }),
					prefix: process.env.prefix as string,
					memberCount: guild.memberCount,
					tiktok: true,
					leaderboard: true,
					media: true,
				},
			}),
			prisma.caseGlobal.create({
				data: {
					guildID: BigInt(guild.id),
					serverName: false,
					reason: false,
				},
			}),
		]);

		// Send welcome message to the server's notify channel
		const embedAuthorData: EmbedAuthorData = {
			name: guild.client.user?.username as string,
			url: `https://www.bentobot.xyz/`,
			iconURL: guild.client.user?.avatarURL() as string,
		};

		const embedFooterData: EmbedFooterData = {
			text: `Bento 🍱 is created by Banner#1017`,
			iconURL: (await guild.client.users.fetch(`232584569289703424`)).avatarURL({
				forceStatic: false,
			}) as string,
		};

		const embed = new EmbedBuilder()
			.setAuthor(embedAuthorData)
			.setTitle(`Hello! My name is Bento 🍱`)
			.setColor(`#${await stylingUtils.urlToColours(guild.client?.user?.avatarURL({ extension: `png` }) as string)}`)
			.setDescription(
				`Thank you for choosing me to service your server!\nMy default prefix is \`${process.env.prefix}\`.\nIf the prefix is conflicting because of other bots, you can change it by writing \`${process.env.prefix}prefix <NEW PREFIX>\`\nUse \`${process.env.prefix}settings\` to check what features I've enabled or disabled by default.\nUse \`${process.env.prefix}commands\` to see a list of all my commands and \`${process.env.prefix}help <command name>\` to get help or info about a command.`,
			)
			.addFields(
				{
					name: `Check out the website for more information and help with all commands and settings`,
					value: `https://www.bentobot.xyz/`
				},
				{
					name: `Need help? Or do you have some ideas or feedback to Bento 🍱? Feel free to join the support server`,
					value: `https://discord.gg/dd68WwP`
				},
				{
					name: `Want to check out the code for Bento 🍱?`,
					value: `https://github.com/thebentobot/bento`
				},
				{
					name: `Want additional benefits when using Bento 🍱?`,
					value: `https://www.patreon.com/bentobot`
				},
				{
					name: `Get a Bento 🍱 for each tip`,
					value: `https://ko-fi.com/bentobot`
				},
				{
					name: `Vote on top.gg and receive 5 Bento 🍱`,
					value: `https://top.gg/bot/787041583580184609/vote`
				},
			)
			.setFooter(embedFooterData)
			.setTimestamp();
		const notifyChannel = await ClientUtils.findNotifyChannel(guild);
		if (notifyChannel) {
			await MessageUtils.send(notifyChannel, embed);
		}

		// Send welcome message to owner
		const owner = await guild.fetchOwner();
		if (owner) {
			await MessageUtils.send(owner.user, embed);
		}
	}
}
