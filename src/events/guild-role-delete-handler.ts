import { PermissionFlagsBits, Role, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildRoleDeleteHandler implements EventHandler {
	public async process(role: Role): Promise<void> {
		const guildData = await prisma.guild.findUnique({
			where: {
				guildID: BigInt(role.guild.id),
			},
		});

		const autoRoleData = await prisma.autoRole.findFirst({
			where: {
				guildID: BigInt(role.guild.id),
				roleID: BigInt(role.id),
			},
		});

		const muteRoleData = await prisma.muteRole.findFirst({
			where: {
				guildID: BigInt(role.guild.id),
				roleID: BigInt(role.id),
			},
		});

		const roleData = await prisma.role.findFirst({
			where: {
				guildID: BigInt(role.guild.id),
				roleID: BigInt(role.id),
			},
		});

		const modLogChannelData = await prisma.modLog.findUnique({
			where: {
				guildID: BigInt(role.guild.id),
			},
		});

		let modLogChannel: TextChannel;

		if (autoRoleData) {
			await prisma.autoRole.delete({
				where: {
					autoRoleID: autoRoleData.autoRoleID,
				},
			});
			if (modLogChannelData) {
				modLogChannel = role.client.channels.cache.get(`${modLogChannelData.channel}`) as TextChannel;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`A deleted role called **${role.name}** was an **auto role** and has been deleted from Bento's database.\nIf you want a new auto role, please use ${guildData?.prefix}autoRole again.`,
				);
			}
		} else if (muteRoleData) {
			await prisma.muteRole.delete({
				where: {
					roleID: muteRoleData.roleID,
				},
			});
			if (modLogChannelData) {
				modLogChannel = role.client.channels.cache.get(`${modLogChannelData.channel}`) as TextChannel;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`A deleted role called **${role.name}** was a **mute role** and has been deleted from Bento's database.\nIf you want a new mute role, please use ${guildData?.prefix}muteRole again.`,
				);
			}
		} else if (roleData) {
			await prisma.role.delete({
				where: {
					id: roleData.id,
				},
			});
			const availableRoleData = await prisma.availableRolesGuild.findFirst({
				where: {
					guildID: BigInt(role.guild.id),
					role: role.name,
				},
			});
			if (availableRoleData) {
				await prisma.availableRolesGuild.delete({
					where: {
						id: availableRoleData.id,
					},
				});
			}
			if (modLogChannelData) {
				modLogChannel = role.client.channels.cache.get(`${modLogChannelData.channel}`) as TextChannel;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`A deleted role called **${role.name}** was a role users could assign in the role management channel, and it has been deleted from Bento's database.\nRemember to update the role channel message by using \`${guildData?.prefix}role update\`.`,
				);
			}
		} else if (modLogChannelData) {
			modLogChannel = role.client.channels.cache.get(`${modLogChannelData.channel}`) as TextChannel;
			if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
			if (!modLogChannel.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
			await MessageUtils.send(
				modLogChannel,
				`A role called **${role.name}** was deleted.\nGet more info in the audit log.`,
			);
		}
	}
}
