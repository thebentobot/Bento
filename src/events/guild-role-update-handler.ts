import { PermissionFlagsBits, Role, TextChannel } from 'discord.js';

import { prisma } from '../services/prisma.js';
import { MessageUtils } from '../utils/message-utils.js';
import { EventHandler } from './event-handler.js';

export class GuildRoleUpdateHandler implements EventHandler {
	public async process(oldRole: Role, newRole: Role): Promise<void> {
		const guildData = await prisma.guild.findUnique({
			where: {
				guildID: BigInt(oldRole.guild.id),
			},
		});

		const muteRoleData = await prisma.muteRole.findUnique({
			where: {
				guildID: BigInt(oldRole.guild.id),
			},
		});

		const roleData = await prisma.role.findFirst({
			where: {
				roleID: BigInt(oldRole.id),
			},
		});

		const modLogData = await prisma.modLog.findUnique({
			where: {
				guildID: BigInt(oldRole.guild.id),
			},
		});

		if (modLogData) {
			const modLogChannel: TextChannel = oldRole.client.channels.cache.get(`${modLogData.channel}`) as TextChannel;
			if (muteRoleData && newRole.permissions.has(PermissionFlagsBits.SendMessages)) {
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`The mute role **${oldRole.name}** has been updated${
						oldRole.name === newRole.name ? ` ` : ` to ${newRole.name}`
					} and has send messages enabled, which goes against the purpose of a mute role.\nIf you want a new mute role, please use ${
						guildData?.prefix
					}muteRole again.`,
				);
			}
			if (roleData && roleData.roleName !== newRole.name) {
				await roleDataUpdate(newRole, true, modLogChannel);
			}
			if (oldRole.name !== newRole.name) {
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`A role called **${oldRole.name}** was updated to **${newRole.name}**.\nGet more info in the audit log.`,
				);
			}
			if (oldRole.permissions !== newRole.permissions) {
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				if (!modLogChannel.permissionsFor(oldRole.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					modLogChannel,
					`A role called **${
						oldRole.name === newRole.name ? newRole.name : `${newRole.name}(previously known as ${oldRole.name})`
					}** has its permissions updated.\nGet more info in the audit log.`,
				);
			}
		} else {
			// eslint-disable-next-line no-lonely-if
			if (roleData && roleData.roleName !== newRole.name) {
				await roleDataUpdate(newRole, false);
			}
		}

		async function roleDataUpdate(role: Role, modLog: boolean, channel?: TextChannel) {
			await prisma.role.updateMany({
				where: {
					roleID: BigInt(role.id),
				},
				data: {
					roleName: role.name,
				},
			});
			await prisma.availableRolesGuild.updateMany({
				where: {
					role: roleData?.roleName as string,
					guildID: BigInt(role.guild.id),
				},
				data: {
					role: role.name,
				},
			});
			if (modLog) {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.ViewChannel)) return;
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				if (!channel!.permissionsFor(role.client.user?.id as string)?.has(PermissionFlagsBits.SendMessages)) return;
				await MessageUtils.send(
					channel as TextChannel,
					`You have updated the role name for the role **${oldRole.name}** to **${newRole.name}**, which is a role users can assign in the role management channel, and it has been updated accordingly in the database.\nRemember to update the role channel message by using \`${guildData?.prefix}role update\` and perhaps change the role commands to obtain the role, if the name differs a lot.`,
				);
			} else {
				return;
			}
		}
	}
}
