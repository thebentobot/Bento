import { ApplicationCommandData, CommandInteraction, DMChannel, Message, PermissionString, TextChannel } from 'discord.js';
import { EventData } from '../models/internal-models';

export interface Command {
	name?: string;
    aliases?: string[];
	metadata: ApplicationCommandData;
	requireDev: boolean;
	requireGuild: boolean;
	requireClientPerms: PermissionString[];
	requireUserPerms: PermissionString[];
	requirePremium: boolean;
	execute(intr?: CommandInteraction, data?: EventData, args?: string[],
        msg?: Message,
        channel?: TextChannel | DMChannel,
        hasPremium?: boolean): Promise<void>;
}
