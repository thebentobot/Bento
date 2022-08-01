import { Channel, Client, NewsChannel, Role, StageChannel, VoiceChannel } from 'discord.js';
import { DiscordAPIError, Guild, GuildMember, TextChannel, User } from 'discord.js';
import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/v9';

import { PermissionUtils, RegexUtils } from './index.js';

const FETCH_MEMBER_LIMIT = 20;

export class ClientUtils {
	public static async getUser(client: Client, discordId: string): Promise<User | void> {
		discordId = RegexUtils.discordId(discordId);
		if (!discordId) {
			return;
		}

		try {
			return await client.users.fetch(discordId);
		} catch (error) {
			// 10013: "Unknown User"
			if (error instanceof DiscordAPIError && [10013].includes((Number(error.code)))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async findMember(guild: Guild, input: string): Promise<GuildMember | void> {
		try {
			const discordId = RegexUtils.discordId(input);
			if (discordId) {
				return await guild.members.fetch(discordId);
			}

			const tag = RegexUtils.tag(input);
			if (tag) {
				return (await guild.members.fetch({ query: tag.username, limit: FETCH_MEMBER_LIMIT })).find(
					(member) => member.user.discriminator === tag.discriminator,
				);
			}

			return (await guild.members.fetch({ query: input, limit: 1 })).first();
		} catch (error) {
			// 10007: "Unknown Member"
			// 10013: "Unknown User"
			if (error instanceof DiscordAPIError && [10007, 10013].includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async getChannel(client: Client, discordId: string): Promise<Channel | null | void> {
		discordId = RegexUtils.discordId(discordId);
		if (!discordId) {
			return;
		}

		try {
			return await client.channels.fetch(discordId);
		} catch (error) {
			// 10013: "Unknown Channel"
			if (error instanceof DiscordAPIError && [10003].includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async findNotifyChannel(guild: Guild): Promise<TextChannel | NewsChannel> {
		// Prefer the system channel
		const systemChannel = guild.systemChannel;
		if (systemChannel && PermissionUtils.canSend(systemChannel, true)) {
			return systemChannel;
		}

		const channelRegex = /bot|command|cmd/i;

		// Otherwise look for a bot channel
		return (await guild.channels.fetch()).find(
			(channel) =>
				(channel instanceof TextChannel || channel instanceof NewsChannel) &&
				PermissionUtils.canSend(channel, true) &&
				channelRegex.test(channel.name),
		) as TextChannel | NewsChannel;
	}

	public static async findRole(guild: Guild, input: string): Promise<Role | null | undefined> {
		try {
			const discordId = RegexUtils.discordId(input);
			if (discordId) {
				return await guild.roles.fetch(discordId);
			}

			const search = input.toLowerCase();
			return (await guild.roles.fetch()).find((role) => role.name.toLowerCase().includes(search));
		} catch (error) {
			if (error instanceof DiscordAPIError && [DiscordApiErrors.UnknownRole].includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async findTextChannel(guild: Guild, input: string): Promise<NewsChannel | TextChannel | undefined> {
		try {
			const discordId = RegexUtils.discordId(input);
			if (discordId) {
				const channel = await guild.channels.fetch(discordId);
				if (channel instanceof NewsChannel || channel instanceof TextChannel) {
					return channel;
				} else {
					return;
				}
			}

			const search = input.toLowerCase().replaceAll(` `, `-`);
			return [...(await guild.channels.fetch()).values()]
				.filter((channel) => channel instanceof NewsChannel || channel instanceof TextChannel)
				.map((channel) => channel as NewsChannel | TextChannel)
				.find((channel) => channel.name.toLowerCase().includes(search));
		} catch (error) {
			if (error instanceof DiscordAPIError && [DiscordApiErrors.UnknownChannel].includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async findVoiceChannel(guild: Guild, input: string): Promise<StageChannel | VoiceChannel | undefined> {
		try {
			const discordId = RegexUtils.discordId(input);
			if (discordId) {
				const channel = await guild.channels.fetch(discordId);
				if (channel instanceof StageChannel || channel instanceof VoiceChannel) {
					return channel;
				} else {
					return;
				}
			}

			const search = input.toLowerCase();
			return [...(await guild.channels.fetch()).values()]
				.filter((channel) => channel instanceof StageChannel || channel instanceof VoiceChannel)
				.map((channel) => channel as StageChannel | VoiceChannel)
				.find((channel) => channel.name.toLowerCase().includes(search));
		} catch (error) {
			if (error instanceof DiscordAPIError && [DiscordApiErrors.UnknownChannel].includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}
}
