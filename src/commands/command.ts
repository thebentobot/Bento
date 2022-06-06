import { CommandInteraction, Message, PermissionString } from 'discord.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { RateLimiter } from 'discord.js-rate-limiter';
import { EventData } from '../models/internal-models.js';

export enum CommandType {
	Both = `Both`,
	MessageCommand = `MessageCommand`,
	SlashCommand = `SlashCommand`,
}

export interface Command {
	adminOnly?: boolean;
	requireSetup?: boolean;
	cooldown?: RateLimiter;
	slashDescription: string;
	description: string;
	usage: string;
	website: string;
	category: string;
	name: string;
	commandType: CommandType;
	deferType?: CommandDeferAccessType;
	aliases?: string[];
	metadata?: RESTPostAPIChatInputApplicationCommandsJSONBody;
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

export enum CommandDeferAccessType {
	PUBLIC = `PUBLIC`,
	HIDDEN = `HIDDEN`,
	NONE = `NONE`,
}
