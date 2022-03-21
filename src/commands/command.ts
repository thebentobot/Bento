import { CommandInteraction, Message, PermissionString, ChatInputApplicationCommandData } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';
import { EventData } from '../models/internal-models.js';

export interface Command {
	adminOnly?: boolean;
	requireSetup?: boolean;
	cooldown?: RateLimiter;
	name?: string;
	deferType?: CommandDeferType;
	aliases?: string[];
	metadata?: ChatInputApplicationCommandData;
	ownerOnly?: boolean;
	guildOnly?: boolean;
	requireDev: boolean;
	requireGuild: boolean;
	requireClientPerms: PermissionString[];
	requireUserPerms: PermissionString[];
	requirePremium: boolean;
	executeIntr?(intr: CommandInteraction, data?: EventData): Promise<void>;
	executeMsgCmd?(msg: Message, args?: string[], data?: EventData): Promise<void>;
}

export enum CommandDeferType {
	PUBLIC = `PUBLIC`,
	HIDDEN = `HIDDEN`,
	NONE = `NONE`,
}
