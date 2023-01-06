import { guildMember, user } from '@prisma/client';
import { ChannelType, Guild, Message, MessageType, PermissionFlagsBits } from 'discord.js';

import { CommandHandler, EventHandler, TriggerHandler } from './index.js';
import { GuildRepo } from '../services/database/repos/guild-repo.js';
import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/index.js';
import { DateTime } from 'luxon';

const hasEmoteRegex = /<a?:.+:\d+>/gm;
const emoteRegex = /<:.+:(\d+)>/gm;
const animatedEmoteRegex = /<a:.+:(\d+)>/gm;

const guildMap = new Map<string, number>();

export class MessageHandler implements EventHandler {
	constructor(private commandHandler: CommandHandler, private triggerHandler: TriggerHandler) {}

	public async process(msg: Message): Promise<void> {
		if (msg.author.bot) return;
		// Don't respond to system messages or self
		if (msg.system || msg.author.id === msg.client.user?.id) {
			return;
		}

		// Don't respond to DM's
		if (msg.channel.type === ChannelType.DM) {
			return;
		}

		if (msg.guild) {
			const getGuildMapTimeValue = guildMap.get(msg.guild.id);
			if (!getGuildMapTimeValue) {
				this.updateGuild(msg.guild);
			} else {
				// eslint-disable-next-line no-lonely-if
				if (DateTime.fromMillis(getGuildMapTimeValue).diffNow().days > 1) {
					guildMap.delete(msg.guild.id);
					this.updateGuild(msg.guild);
				}
			}
		}

		// find user and check if they're saved in the DB
		let user = await prisma.user.findUnique({ where: { userID: BigInt(msg.author.id) } });

		if (user === null) {
			user = (await prisma.user.create({
				data: {
					userID: BigInt(msg.author.id),
					username: msg.author.username,
					discriminator: msg.author.discriminator,
					avatarURL: msg.author.avatarURL({
						extension: `webp`,
						forceStatic: false,
						size: 1024,
					}),
					xp: 0,
					level: 1,
				},
			})) as user;
		}

		// find guild member and check if they're saved in the DB
		let guildMember = await prisma.guildMember.findFirst({
			where: {
				userID: BigInt(msg.author.id),
				guildID: BigInt(msg.guild?.id as string),
			},
		});

		if (guildMember === null) {
			guildMember = (await prisma.guildMember.create({
				data: {
					userID: BigInt(msg.author.id),
					guildID: BigInt(msg.guild?.id as string),
					avatarURL: msg.member?.displayAvatarURL({
						extension: `png`,
						forceStatic: false,
						size: 1024,
					}),
					xp: 0,
					level: 1,
				},
			})) as guildMember;
		}

		// XP

		const messageGuild = await prisma.guild.findUnique({ where: { guildID: BigInt(msg.guild?.id as string) } });

		const patreonUser = await prisma.patreon.findUnique({ where: { userID: BigInt(msg.author.id) } });

		if (messageGuild?.leaderboard === true) {
			if (patreonUser) {
				if (patreonUser.follower === true) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					await MessageUtils.addXpServer(guildMember.guildMemberID, 46).catch();
					await MessageUtils.addXpGlobal(user.userID, 46).catch();
				} else if (patreonUser.enthusiast === true) {
					await MessageUtils.addXpServer(guildMember.guildMemberID, 69).catch();
					await MessageUtils.addXpGlobal(user.userID, 69).catch();
				} else if (patreonUser.disciple === true) {
					await MessageUtils.addXpServer(guildMember.guildMemberID, 92).catch();
					await MessageUtils.addXpGlobal(user.userID, 92).catch();
				} else if (patreonUser.sponsor === true) {
					await MessageUtils.addXpServer(guildMember.guildMemberID, 115).catch();
					await MessageUtils.addXpGlobal(user.userID, 115).catch();
				}
			} else {
				await MessageUtils.addXpServer(guildMember.guildMemberID, 23).catch();
				await MessageUtils.addXpGlobal(user.userID, 23).catch();
			}
		}

		// add a function for roles - or are we gonna make a new and better one with discord API features?

		// add a function for notifications here
		//await notificationUtils.notificationCheck(msg);

		const channelDisableData = await prisma.channelDisable.findUnique({ where: { channelID: BigInt(msg.channel.id) } });

		if (channelDisableData && !msg.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
			return;
		}

		if (msg.mentions.users.has(msg.client?.user?.id as string) && msg.content.match(hasEmoteRegex)) {
			let emoji;

			if ((emoji = emoteRegex.exec(msg.content))) {
				const url = `https://cdn.discordapp.com/emojis/` + emoji[1] + `.png?v=1`;
				await MessageUtils.send(msg.channel, url);
				return;
			} else if ((emoji = animatedEmoteRegex.exec(msg.content))) {
				const url = `https://cdn.discordapp.com/emojis/` + emoji[1] + `.gif?v=1`;
				await MessageUtils.send(msg.channel, url);
				return;
			}
		}

		const argsCheck = msg.content.trim().split(` `);
		let mentionMsgCommand = false;

		if (
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			argsCheck[0].includes(`<@${msg.client.user!.id}>`) ||
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			(argsCheck[0].includes(`<@!${msg.client.user!.id}>`) && msg.type !== MessageType.Reply)
		) {
			mentionMsgCommand = true;
		}

		let args: string[];

		if (mentionMsgCommand === true) {
			args = msg.content.trim().split(/ +/g);
		} else {
			const getPrefix = (await new GuildRepo().getGuild(msg.guild?.id as string)).prefix;
			args = msg.content.slice(getPrefix.length).trim().split(/ +/g);
			args.unshift(getPrefix);
		}

		// Process command
		if (await this.commandHandler.shouldHandle(msg, args)) {
			await this.commandHandler.processMessage(msg, args);
			return;
		}

		// Process trigger
		await this.triggerHandler.process(msg);
	}

	private async updateGuild(guild: Guild): Promise<void> {
		await prisma.guild.update({
			where: {
				guildID: BigInt(guild.id),
			},
			data: {
				guildName: guild.name,
				icon: guild.iconURL({
					extension: `webp`,
					forceStatic: false,
					size: 1024,
				}),
				memberCount: guild.memberCount,
			},
		});
		guildMap.set(guild.id, DateTime.now().toMillis());
		return;
	}
}
