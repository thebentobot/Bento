import { ClientUser, CommandInteraction, GuildChannel, GuildMember, MessageEmbed, Permissions, ThreadChannel } from 'discord.js';
import { Command } from '../commands/index.js';
import { config as Config } from '../config/config.js';
import { debug as Debug } from '../config/debug.js';
import { Permission } from '../models/enums/index.js';
import { EventData } from '../models/internal-models.js';
import { InteractionUtils } from './interaction-utils.js';

export class CommandUtils {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static async runChecks(command: Command, intr: CommandInteraction, _data: EventData): Promise<boolean> {
		if (command.requireDev && !Config.developers.includes(intr.user.id)) {
			await InteractionUtils.send(
				intr,
				new MessageEmbed().setDescription(`This command can only be used by developers.`).setColor(`#ffcc66`),
			);
			return false;
		}

		if (command.requireGuild && !intr.guild) {
			await InteractionUtils.send(
				intr,
				new MessageEmbed().setDescription(`This command can only be used in a server.`).setColor(`#ffcc66`),
			);
			return false;
		}

		if (
			intr.channel instanceof GuildChannel || intr.channel instanceof ThreadChannel &&
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			!intr.channel.permissionsFor(intr.client.user as ClientUser)!.has(command.requireClientPerms)
		) {
			const embed = new MessageEmbed()
				.setDescription(
					`I don't have all permissions required to run that command here! Please check the server and channel permissions to make sure I have the following permissions.\n\nRequired permissions: ${command.requireClientPerms
						.map((perm) => `**${Permission.Data[perm].displayName()}**`)
						.join(`, `)}`,
				)
				.setColor(`#ffcc66`);
			await InteractionUtils.send(intr, embed);
			return false;
		}

		// TODO: Remove "as GuildMember",  why does discord.js have intr.member as a "APIInteractionGuildMember"?
		if (intr.member && !this.hasPermission(intr.member as GuildMember, command)) {
			const embed = new MessageEmbed()
				.setDescription(`You don't have permission to run that command!`)
				.setColor(`#ffcc66`);
			await InteractionUtils.send(intr, embed);
			return false;
		}

		return true;
	}

	private static hasPermission(member: GuildMember, command: Command): boolean {
		// Debug option to bypass permission checks
		if (Debug.skip.checkPerms) {
			return true;
		}

		// Developers, server owners, and members with "Manage Server" have permission for all commands
		if (
			member.guild.ownerId === member.id ||
			member.permissions.has(Permissions.FLAGS.MANAGE_GUILD) ||
			Config.developers.includes(member.id)
		) {
			return true;
		}

		// Check if member has required permissions for command
		if (!member.permissions.has(command.requireUserPerms)) {
			return false;
		}

		return true;
	}
}
