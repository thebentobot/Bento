import { ClientUser, CommandInteraction, GuildChannel, GuildMember, MessageEmbed, Permissions } from 'discord.js';

import { MessageUtils } from '.';
import { Command } from '../commands';
import { Permission } from '../models/enums';
import { EventData } from '../models/internal-models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Config = require(`../../config/config.json`);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Debug = require(`../../config/debug.json`);

export class CommandUtils {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public static async runChecks(command: Command, intr: CommandInteraction, _data: EventData): Promise<boolean> {
		if (command.requireDev && !Config.developers.includes(intr.user.id)) {
			await MessageUtils.sendIntr(intr, new MessageEmbed().setDescription(`This command can only be used by developers.`).setColor(`#ffcc66`));
			return false;
		}

		if (command.requireGuild && !intr.guild) {
			await MessageUtils.sendIntr(intr, new MessageEmbed().setDescription(`This command can only be used in a server.`).setColor(`#ffcc66`));
			return false;
		}

		if (
			intr.channel instanceof GuildChannel &&
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			!intr.channel.permissionsFor(intr.client.user as ClientUser)!.has(command.requireClientPerms)
		) {
			const embed = new MessageEmbed()
				.setDescription(`I don't have all permissions required to run that command here! Please check the server and channel permissions to make sure I have the following permissions.\n\nRequired permissions: ${command.requireClientPerms.map((perm) => `**${Permission.Data[perm].displayName()}**`).join(`, `)}`)
				.setColor(`#ffcc66`);
			await MessageUtils.sendIntr(intr, embed);
			return false;
		}

		// TODO: Remove "as GuildMember",  why does discord.js have intr.member as a "APIInteractionGuildMember"?
		if (intr.member && !this.hasPermission(intr.member as GuildMember, command)) {
			const embed = new MessageEmbed()
				.setDescription(`You don't have permission to run that command!`)
				.setColor(`#ffcc66`);
			await MessageUtils.sendIntr(intr, embed);
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
