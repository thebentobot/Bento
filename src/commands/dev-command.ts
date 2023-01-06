import djs, { CommandInteraction, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import os from 'os';
import { createRequire } from 'node:module';
import typescript from 'typescript';
import { EventData } from '../models/internal-models.js';
import { ClientUtils, FormatUtils, MessageUtils, ShardUtils, stylingUtils } from '../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from './command.js';
import { InteractionUtils } from '../utils/interaction-utils.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { DateTime } from 'luxon';
import { prisma } from '../services/prisma.js';

const require = createRequire(import.meta.url);
const TsConfig = require(`../../tsconfig.json`);

export class DevCommand implements Command {
	public name = `dev`;
	public aliases = [`developer`];
	public slashDescription = `View system info`;
	public commandType = CommandType.MessageCommand;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `dev`,
		description: `View developer info`,
	};
	public requireDev = true;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireGuild = false;
	public requirePremium = false;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `View system info`;
	public usage = `dev | /dev`;
	public website = `https://www.bentobot.xyz/commands#dev`;
	public category = ``;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.devCommand(intr);
		await InteractionUtils.send(intr, command);
	}

	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.devCommand(msg);
		await MessageUtils.send(msg.channel, command);
	}

	private async devCommand(message: Message | CommandInteraction): Promise<EmbedBuilder | string> {
		const element = message;
		const shardCount = element.client.shard?.count ?? 1;
		let serverCount: number;
		if (element.client.shard) {
			try {
				serverCount = await ShardUtils.serverCount(element.client.shard);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			} catch (error: any) {
				// SHARDING_IN_PROCESS: Shards are still being spawned.
				if (error.name.includes(`SHARDING_IN_PROCESS`)) {
					return `${element.client.user?.username} is still starting up. Try again later.`;
				} else {
					throw error;
				}
			}
		} else {
			serverCount = element.client.guilds.cache.size;
		}

		const starTimeAvatars = DateTime.now();
		const refreshAllAvatars = await this.refreshAllAvatars(message);
		const avatarsTime = DateTime.now();
		const starTimeGuilds = DateTime.now();
		const refreshAllGuilds = await this.refreshAllGuilds(message);
		const guildsTime = DateTime.now();

		const memory = process.memoryUsage();
		const embed = new EmbedBuilder()
			.setColor(
				`#${await stylingUtils.urlToColours(element.guild?.client?.user?.avatarURL({ extension: `png` }) as string)}`,
			)
			.setTitle(`${element.client.user?.username} - Runtime info`)
			.setDescription(
				`**Updates**\nAttempted to update ${refreshAllAvatars.attemptUsers} users on ${
					refreshAllAvatars.attemptGuilds
				} guilds. Updated ${refreshAllAvatars.users} user avatars and ${
					refreshAllAvatars.guildMembers
				} guild member avatars for ${refreshAllAvatars.guilds}. It took ${avatarsTime
					.diff(starTimeAvatars, [`minutes`, `seconds`, `milliseconds`])
					.toHuman()}.
				Attempted to update ${refreshAllGuilds.attemptGuilds} guilds. Updated ${
					refreshAllGuilds.guilds
				} guilds. It took ${guildsTime.diff(starTimeGuilds, [`minutes`, `seconds`, `milliseconds`]).toHuman()}.\n
				**Versions**\n**Node.js**: ${process.version}\n**TypeScript**: v${typescript.version}\n**ECMAScript**: ${
					TsConfig.compilerOptions.target
				}\n**discord.js**: v${
					djs.version
				}\n\n**Stats**\n**Shards**: ${shardCount.toLocaleString()}\n**Servers**: ${serverCount.toLocaleString()} (${Math.round(
					serverCount / shardCount,
				).toLocaleString()}/Shard)\n\n**Memory**\n**RSS**: ${FormatUtils.fileSize(memory.rss)} (${
					serverCount > 0 ? FormatUtils.fileSize(memory.rss / serverCount) : `N/A`
				}/Server)\n**Heap**: ${FormatUtils.fileSize(memory.heapTotal)} (${
					serverCount > 0 ? FormatUtils.fileSize(memory.heapTotal / serverCount) : `N/A`
				}/Server)\n**Used**: ${FormatUtils.fileSize(memory.heapUsed)} (${
					serverCount > 0 ? FormatUtils.fileSize(memory.heapUsed / serverCount) : `N/A`
				}/Server)\n\n**IDs**\n**Hostname**: ${os.hostname}\n**Shard ID**: ${(
					element.guild?.shardId ?? 0
				).toString()}\n**Server ID**: ${element.guild?.id ?? `N/A`}\n**Bot ID**: ${
					element.client.user?.id
				}\n**User ID**: ${element.member?.user.id}`,
			);
		return embed;
	}

	private async refreshAllAvatars(
		message: Message | CommandInteraction,
	): Promise<{ attemptUsers: number; attemptGuilds: number; guildMembers: number; users: number; guilds: number }> {
		const usersData = await prisma.user.findMany();
		let usersAvatars = 0;
		usersData.forEach(async (user) => {
			const discordUser = await ClientUtils.getUser(message.client, user.userID.toString());
			if (discordUser) {
				await prisma.user.update({
					where: {
						userID: user.userID,
					},
					data: {
						avatarURL: discordUser.avatarURL({ extension: `webp`, forceStatic: false, size: 1024 }),
					},
				});
				++usersAvatars;
				return;
			} else {
				return;
			}
		});
		const guildMembersData = await prisma.guild.findMany({ include: { guildMember: true } });
		let guildMembersAvatars = 0;
		let guilds = 0;
		guildMembersData.forEach(async (guild) => {
			const getGuild = await ClientUtils.getGuild(message.client, guild.guildID.toString());
			if (getGuild) {
				guild.guildMember.forEach(async (guildMember) => {
					const discordGuildMember = await ClientUtils.findMember(getGuild, guildMember.userID.toString());
					if (discordGuildMember) {
						await prisma.guildMember.update({
							where: {
								guildMemberID: guildMember.guildMemberID,
							},
							data: {
								avatarURL: discordGuildMember.avatarURL({ extension: `webp`, forceStatic: false, size: 1024 }),
							},
						});
						++guildMembersAvatars;
						return;
					} else {
						return;
					}
				});
				++guilds;
				return;
			} else {
				return;
			}
		});
		return {
			guildMembers: guildMembersAvatars,
			guilds: guilds,
			users: usersAvatars,
			attemptGuilds: guildMembersData.length,
			attemptUsers: usersData.length,
		};
	}

	private async refreshAllGuilds(
		message: Message | CommandInteraction,
	): Promise<{ attemptGuilds: number; guilds: number }> {
		const guildsData = await prisma.guild.findMany();
		let guilds = 0;
		guildsData.forEach(async (guild) => {
			const discordGuild = await ClientUtils.getGuild(message.client, guild.guildID.toString());
			if (discordGuild) {
				await prisma.guild.update({
					where: {
						guildID: guild.guildID,
					},
					data: {
						guildName: discordGuild.name,
						icon: discordGuild.iconURL({ extension: `webp`, forceStatic: false, size: 1024 }),
						memberCount: discordGuild.memberCount,
					},
				});
				++guilds;
				return;
			} else {
				return;
			}
		});
		return { attemptGuilds: guildsData.length, guilds: guilds };
	}
}
