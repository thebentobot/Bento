import { guild } from '@prisma/client';
import { Channel, ClientUser, DMChannel, GuildChannel, GuildMember, PermissionFlagsBits, ThreadChannel } from 'discord.js';
import { Command } from '../commands/index.js';

export class PermissionUtils {
	public static canSend(channel: Channel, embedLinks = false): boolean {
		if (channel instanceof DMChannel) {
			return true;
		} else if (channel instanceof GuildChannel || channel instanceof ThreadChannel) {
			const channelPerms = channel.permissionsFor(channel.client.user as ClientUser);
			if (!channelPerms) {
				// This can happen if the guild disconnected while a collector is running
				return false;
			}

			// VIEW_CHANNEL - Needed to view the channel
			// SEND_MESSAGES - Needed to send messages
			// EMBED_LINKS - Needed to send embedded links
			return channelPerms.has([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.SendMessages,
				...(embedLinks ? [PermissionFlagsBits.EmbedLinks] : []),
			]);
		} else {
			return false;
		}
	}

	public static canMention(channel: Channel): boolean {
		if (channel instanceof DMChannel) {
			return true;
		} else if (channel instanceof GuildChannel || channel instanceof ThreadChannel) {
			const channelPerms = channel.permissionsFor(channel.client.user as ClientUser);
			if (!channelPerms) {
				// This can happen if the guild disconnected while a collector is running
				return false;
			}

			// VIEW_CHANNEL - Needed to view the channel
			// MENTION_EVERYONE - Needed to mention @everyone, @here, and all roles
			return channelPerms.has([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.MentionEveryone]);
		} else {
			return false;
		}
	}

	public static canReact(channel: Channel, removeOthers = false): boolean {
		if (channel instanceof DMChannel) {
			return true;
		} else if (channel instanceof GuildChannel || channel instanceof ThreadChannel) {
			const channelPerms = channel.permissionsFor(channel.client.user as ClientUser);
			if (!channelPerms) {
				// This can happen if the guild disconnected while a collector is running
				return false;
			}

			// VIEW_CHANNEL - Needed to view the channel
			// ADD_REACTIONS - Needed to add new reactions to messages
			// READ_MESSAGE_HISTORY - Needed to add new reactions to messages
			//    https://discordjs.guide/popular-topics/permissions-extended.html#implicit-permissions
			// MANAGE_MESSAGES - Needed to remove others reactions
			return channelPerms.has([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.AddReactions,
				PermissionFlagsBits.ReadMessageHistory,
				...(removeOthers ? [PermissionFlagsBits.ManageMessages] : []),
			]);
		} else {
			return false;
		}
	}

	public static canPin(channel: Channel, unpinOld = false): boolean {
		if (channel instanceof DMChannel) {
			return true;
		} else if (channel instanceof GuildChannel || channel instanceof ThreadChannel) {
			const channelPerms = channel.permissionsFor(channel.client.user as ClientUser);
			if (!channelPerms) {
				// This can happen if the guild disconnected while a collector is running
				return false;
			}

			// VIEW_CHANNEL - Needed to view the channel
			// MANAGE_MESSAGES - Needed to pin messages
			// READ_MESSAGE_HISTORY - Needed to find old pins to unpin
			return channelPerms.has([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.ManageMessages,
				...(unpinOld ? [PermissionFlagsBits.ReadMessageHistory] : []),
			]);
		} else {
			return false;
		}
	}

	public static hasPermission(member: GuildMember, guildData: guild, command?: Command): boolean {
		if (!command || command.adminOnly) {
			// Developers, server owners, and members with "Manage Server" have permission for all commands
			if (member.guild.ownerId === member.id || member.permissions.has(PermissionFlagsBits.ManageGuild)) {
				return true;
			}

			return false;
		}
		return true;
	}

	public static canCreateThreads(channel: Channel, manageThreads = false): boolean {
		if (channel instanceof DMChannel) {
			return false;
		} else if (channel instanceof GuildChannel || channel instanceof ThreadChannel) {
			const channelPerms = channel.permissionsFor(channel.client.user as ClientUser);
			if (!channelPerms) {
				// This can happen if the guild disconnected while a collector is running
				return false;
			}

			// VIEW_CHANNEL - Needed to view the channel
			// CREATE_PUBLIC_THREADS - Needed to create public threads
			// MANAGE_THREADS - Needed to rename, delete, archive, unarchive, slow mode threads
			return channelPerms.has([
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.CreatePublicThreads,
				...(manageThreads ? [PermissionFlagsBits.ManageThreads] : []),
			]);
		} else {
			return false;
		}
	}
}
