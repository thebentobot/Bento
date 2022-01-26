import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/v9';
import {
	CommandInteraction,
	DiscordAPIError,
	EmojiResolvable,
	Message,
	MessageEmbed,
	MessageOptions,
	MessageReaction,
	TextBasedChannel,
	User,
} from 'discord.js';
import { prisma } from '../services/prisma.js';

const IGNORED_ERRORS = [
	DiscordApiErrors.UnknownMessage,
	DiscordApiErrors.UnknownChannel,
	DiscordApiErrors.UnknownGuild,
	DiscordApiErrors.UnknownUser,
	DiscordApiErrors.UnknownInteraction,
	DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
	DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];


const cooldownServer = new Set();
const cooldownGlobal = new Set();

export class MessageUtils {
	public static async send(
		target: User | TextBasedChannel,
		content: string | MessageEmbed | MessageOptions,
	): Promise<Message | void> {
		try {
			const msgOptions = this.messageOptions(content);
			return await target.send(msgOptions);
		} catch (error) {
			// 10003: "Unknown channel"
			// 10004: "Unknown guild"
			// 10013: "Unknown user"
			// 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
			if (error instanceof DiscordAPIError && [10003, 10004, 10013, 50007].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async editReplyIntr(
		intr: CommandInteraction,
		content: string | MessageEmbed | MessageOptions
	): Promise<Message | void> {
		try {
			const msgOptions = this.messageOptions(content);
			return (await intr.editReply({
				...msgOptions,
			})) as Message;
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async sendIntr(
		intr: CommandInteraction,
		content: string | MessageEmbed | MessageOptions,
	): Promise<Message | void> {
		try {
			const msgOptions = this.messageOptions(content);
			return (await intr.webhook.send(msgOptions)) as Message;
		} catch (error) {
			// 10003: "Unknown channel"
			// 10004: "Unknown guild"
			// 10013: "Unknown user"
			// 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
			if (error instanceof DiscordAPIError && [10003, 10004, 10013, 50007].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async reply(msg: Message, content: string | MessageEmbed | MessageOptions): Promise<Message | void> {
		try {
			const msgOptions = this.messageOptions(content);
			return await msg.reply(msgOptions);
		} catch (error) {
			// 10008: "Unknown Message" (Message was deleted)
			// 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
			if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async edit(msg: Message, content: string | MessageEmbed | MessageOptions): Promise<Message | void> {
		try {
			const msgOptions = this.messageOptions(content);
			return await msg.edit(msgOptions);
		} catch (error) {
			// 10008: "Unknown Message" (Message was deleted)
			// 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
			if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async react(msg: Message, emoji: EmojiResolvable): Promise<MessageReaction | void> {
		try {
			return await msg.react(emoji);
		} catch (error) {
			// 10008: "Unknown Message" (Message was deleted)
			// 90001: "Reaction Blocked" (User blocked bot)
			if (error instanceof DiscordAPIError && [10008, 90001].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async delete(msg: Message): Promise<Message | void> {
		try {
			return await msg.delete();
		} catch (error) {
			// 10008: "Unknown Message" (Message was deleted)
			// 50007: "Cannot send messages to this user" (User blocked bot or DM disabled)
			if (error instanceof DiscordAPIError && [10008, 50007].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async addXpServer(guildMemberId: bigint, xp: number): Promise<void> {
		if (cooldownServer.has(guildMemberId)) {
			return;
		} else {
			const result = await prisma.guildMember.update({
				where: {
					guildMemberID: guildMemberId
				},
				data: {
					xp: {
						increment: xp
					}
				}
			});

			const guildMemberXp = result.xp;
			const guildMemberLevel = result.level;
			const getNeededXP = (level: number) => level * level * 100;
			const needed = getNeededXP(guildMemberLevel);

			if (guildMemberXp >= needed) {
				await prisma.guildMember.update({
					where: {
						guildMemberID: guildMemberId
					},
					data: {
						xp: 0,
						level: {
							increment: 1
						}
					}
				});

				cooldownServer.add(guildMemberId);
				setTimeout(() => {
					cooldownServer.delete(guildMemberId);
				}, 60000); // 1 minute

				return;
			} else {
				cooldownServer.add(guildMemberId);
				setTimeout(() => {
					cooldownServer.delete(guildMemberId);
				}, 60000); // 1 minute

				return;
			}
		}
	}

	public static async addXpGlobal(userId: bigint, xp: number): Promise<void> {
		if (cooldownGlobal.has(userId)) {
			return;
		} else {
			const result = await prisma.user.update({
				where: {
					userID: userId
				},
				data: {
					xp: {
						increment: xp
					}
				}
			});

			const userXp = result.xp;
			const userLevel = result.level;
			const getNeededXP = (level: number) => level * level * 100;
			const needed = getNeededXP(userLevel);

			if (userXp >= needed) {
				await prisma.user.update({
					where: {
						userID: userId
					},
					data: {
						xp: 0,
						level: {
							increment: 1
						}
					}
				});

				cooldownGlobal.add(userId);
				setTimeout(() => {
					cooldownGlobal.delete(userId);
				}, 60000); // 1 minute

				return;
			} else {
				cooldownGlobal.add(userId);
				setTimeout(() => {
					cooldownGlobal.delete(userId);
				}, 60000); // 1 minute
				
				return;
			}
		}
	}

	private static messageOptions(content: string | MessageEmbed | MessageOptions): MessageOptions {
		let options: MessageOptions = {};
		if (typeof content === `string`) {
			options.content = content;
		} else if (content instanceof MessageEmbed) {
			options.embeds = [content];
		} else {
			options = content;
		}
		return options;
	}
}
