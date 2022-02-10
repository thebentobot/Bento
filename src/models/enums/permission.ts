import { PermissionString } from 'discord.js';

interface PermissionData {
	displayName(): string;
}

export class Permission {
	public static Data: {
		[key in PermissionString]: PermissionData;
	} = {
			ADD_REACTIONS: {
				displayName(): string {
					return `Add Reactions`;
				},
			},
			ADMINISTRATOR: {
				displayName(): string {
					return `Administrator`;
				},
			},
			ATTACH_FILES: {
				displayName(): string {
					return `Attach files`;
				},
			},
			BAN_MEMBERS: {
				displayName(): string {
					return `Ban Members`;
				},
			},
			CHANGE_NICKNAME: {
				displayName(): string {
					return `Change Nickname`;
				},
			},
			CONNECT: {
				displayName(): string {
					return `Connect`;
				},
			},
			CREATE_INSTANT_INVITE: {
				displayName(): string {
					return `Create Invite`;
				},
			},
			CREATE_PRIVATE_THREADS: {
				displayName(): string {
					return `Create Private Threads`;
				},
			},
			CREATE_PUBLIC_THREADS: {
				displayName(): string {
					return `Create Public Threads`;
				},
			},
			DEAFEN_MEMBERS: {
				displayName(): string {
					return `Deafen Members`;
				},
			},
			EMBED_LINKS: {
				displayName(): string {
					return `Embed Links`;
				},
			},
			KICK_MEMBERS: {
				displayName(): string {
					return `Kick Members`;
				},
			},
			MANAGE_CHANNELS: {
				displayName(): string {
					return `Manage Channel(s)`;
				},
			},
			MANAGE_EMOJIS_AND_STICKERS: {
				displayName(): string {
					return `Manage Emojis and Stickers`;
				},
			},
			MANAGE_EVENTS: {
				displayName(): string {
					return `Manage Events`;
				},
			},
			MANAGE_GUILD: {
				displayName(): string {
					return `Manage Server`;
				},
			},
			MANAGE_MESSAGES: {
				displayName(): string {
					return `Manage Messages`;
				},
			},
			MANAGE_NICKNAMES: {
				displayName(): string {
					return `Manage Nicknames`;
				},
			},
			MANAGE_ROLES: {
				displayName(): string {
					return `Manage roles / Permissions`;
				},
			},
			MANAGE_THREADS: {
				displayName(): string {
					return `Manage Threads`;
				},
			},
			MANAGE_WEBHOOKS: {
				displayName(): string {
					return `Manage Webhooks`;
				},
			},
			MENTION_EVERYONE: {
				displayName(): string {
					return `Mention Everyone, Here and All Roles`;
				},
			},
			MODERATE_MEMBERS: {
				displayName(): string {
					return `Timeout Members`;
				},
			},
			MOVE_MEMBERS: {
				displayName(): string {
					return `Move Members`;
				},
			},
			MUTE_MEMBERS: {
				displayName(): string {
					return `Mute Members`;
				},
			},
			PRIORITY_SPEAKER: {
				displayName(): string {
					return `Priority Speaker`;
				},
			},
			READ_MESSAGE_HISTORY: {
				displayName(): string {
					return `Read Message History`;
				},
			},
			REQUEST_TO_SPEAK: {
				displayName(): string {
					return `Request to Speak`;
				},
			},
			SEND_MESSAGES: {
				displayName(): string {
					return `Send Messages`;
				},
			},
			SEND_MESSAGES_IN_THREADS: {
				displayName(): string {
					return `Send Messages in Threads`;
				},
			},
			SEND_TTS_MESSAGES: {
				displayName(): string {
					return `send Text-to-Speech Messages`;
				},
			},
			SPEAK: {
				displayName(): string {
					return `Speak`;
				},
			},
			START_EMBEDDED_ACTIVITIES: {
				displayName(): string {
					return `Start Activities`;
				},
			},
			STREAM: {
				displayName(): string {
					return `Video`;
				},
			},
			USE_APPLICATION_COMMANDS: {
				displayName(): string {
					return `Use Application Commands`;
				},
			},
			USE_EXTERNAL_EMOJIS: {
				displayName(): string {
					return `Use External Emoji`;
				},
			},
			USE_EXTERNAL_STICKERS: {
				displayName(): string {
					return `Use External Stickers`;
				},
			},
			USE_PRIVATE_THREADS: {
				displayName(): string {
					return `Use Private Threads`;
				},
			},
			USE_PUBLIC_THREADS: {
				displayName(): string {
					return `Use Public Threads`;
				},
			},
			USE_VAD: {
				displayName(): string {
					return `Use Voice Activity`;
				},
			},
			VIEW_AUDIT_LOG: {
				displayName(): string {
					return `View Audit Log`;
				},
			},
			VIEW_CHANNEL: {
				displayName(): string {
					return `View Channel(s)`;
				},
			},
			VIEW_GUILD_INSIGHTS: {
				displayName(): string {
					return `View Server Insights`;
				},
			},
		};
}
