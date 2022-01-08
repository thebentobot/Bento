import { AnyChannel, Client, NewsChannel } from 'discord.js';
import { DiscordAPIError, Guild, GuildMember, TextChannel, User } from 'discord.js';

import { PermissionUtils, RegexUtils } from '.';

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
			if (error instanceof DiscordAPIError && [10013].includes(error.code)) {
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
			if (error instanceof DiscordAPIError && [10007, 10013].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async getChannel(client: Client, discordId: string): Promise<AnyChannel | null | void> {
		discordId = RegexUtils.discordId(discordId);
		if (!discordId) {
			return;
		}

		try {
			return await client.channels.fetch(discordId);
		} catch (error) {
			// 10013: "Unknown Channel"
			if (error instanceof DiscordAPIError && [10003].includes(error.code)) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async findNotifyChannel(guild: Guild): Promise<TextChannel | NewsChannel> {
		// Prefer the system channel
		const systemChannel = guild.systemChannel;
		if (systemChannel && PermissionUtils.canSend(systemChannel)) {
			return systemChannel;
		}

		const channelRegex = /bot|command|cmd/i;

		// Otherwise look for a bot channel
		return (await guild.channels.fetch()).find(
			(channel) =>
				(channel instanceof TextChannel || channel instanceof NewsChannel) &&
				PermissionUtils.canSend(channel) &&
				channelRegex.test(channel.name),
		) as TextChannel | NewsChannel;
	}
}
