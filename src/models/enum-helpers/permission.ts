import { PermissionsString } from 'discord.js';

interface PermissionData {
	displayName(): string;
}

export class Permission {
	public static Data: {
		[key in PermissionsString]: PermissionData;
	} = {
		AddReactions: {
			displayName(): string {
				return `Add Reactions`;
			},
		},
		Administrator: {
			displayName(): string {
				return `Administrator`;
			},
		},
		AttachFiles: {
			displayName(): string {
				return `Attach files`;
			},
		},
		BanMembers: {
			displayName(): string {
				return `Ban Members`;
			},
		},
		ChangeNickname: {
			displayName(): string {
				return `Change Nickname`;
			},
		},
		Connect: {
			displayName(): string {
				return `Connect`;
			},
		},
		CreateInstantInvite: {
			displayName(): string {
				return `Create Invite`;
			},
		},
		CreatePrivateThreads: {
			displayName(): string {
				return `Create Private Threads`;
			},
		},
		CreatePublicThreads: {
			displayName(): string {
				return `Create Public Threads`;
			},
		},
		DeafenMembers: {
			displayName(): string {
				return `Deafen Members`;
			},
		},
		EmbedLinks: {
			displayName(): string {
				return `Embed Links`;
			},
		},
		KickMembers: {
			displayName(): string {
				return `Kick Members`;
			},
		},
		ManageChannels: {
			displayName(): string {
				return `Manage Channel(s)`;
			},
		},
		ManageEmojisAndStickers: {
			displayName(): string {
				return `Manage Emojis and Stickers`;
			},
		},
		ManageEvents: {
			displayName(): string {
				return `Manage Events`;
			},
		},
		ManageGuild: {
			displayName(): string {
				return `Manage Server`;
			},
		},
		ManageMessages: {
			displayName(): string {
				return `Manage Messages`;
			},
		},
		ManageNicknames: {
			displayName(): string {
				return `Manage Nicknames`;
			},
		},
		ManageRoles: {
			displayName(): string {
				return `Manage roles / Permissions`;
			},
		},
		ManageThreads: {
			displayName(): string {
				return `Manage Threads`;
			},
		},
		ManageWebhooks: {
			displayName(): string {
				return `Manage Webhooks`;
			},
		},
		MentionEveryone: {
			displayName(): string {
				return `Mention Everyone, Here and All Roles`;
			},
		},
		ModerateMembers: {
			displayName(): string {
				return `Timeout Members`;
			},
		},
		MoveMembers: {
			displayName(): string {
				return `Move Members`;
			},
		},
		MuteMembers: {
			displayName(): string {
				return `Mute Members`;
			},
		},
		PrioritySpeaker: {
			displayName(): string {
				return `Priority Speaker`;
			},
		},
		ReadMessageHistory: {
			displayName(): string {
				return `Read Message History`;
			},
		},
		RequestToSpeak: {
			displayName(): string {
				return `Request to Speak`;
			},
		},
		SendMessages: {
			displayName(): string {
				return `Send Messages`;
			},
		},
		SendMessagesInThreads: {
			displayName(): string {
				return `Send Messages in Threads`;
			},
		},
		SendTTSMessages: {
			displayName(): string {
				return `send Text-to-Speech Messages`;
			},
		},
		Speak: {
			displayName(): string {
				return `Speak`;
			},
		},
		UseEmbeddedActivities: {
			displayName(): string {
				return `Start Activities`;
			},
		},
		Stream: {
			displayName(): string {
				return `Video`;
			},
		},
		UseApplicationCommands: {
			displayName(): string {
				return `Use Application Commands`;
			},
		},
		UseExternalEmojis: {
			displayName(): string {
				return `Use External Emoji`;
			},
		},
		UseExternalStickers: {
			displayName(): string {
				return `Use External Stickers`;
			},
		},
		UseVAD: {
			displayName(): string {
				return `Use Voice Activity`;
			},
		},
		ViewAuditLog: {
			displayName(): string {
				return `View Audit Log`;
			},
		},
		ViewChannel: {
			displayName(): string {
				return `View Channel(s)`;
			},
		},
		ViewGuildInsights: {
			displayName(): string {
				return `View Server Insights`;
			},
		},
		ManageGuildExpressions: {
			displayName(): string {
				return `Manage Server Expressions`;
			},
		},
		ViewCreatorMonetizationAnalytics: {
			displayName(): string {
				return `View Creator Monetization Analytics`;
			},
		},
		UseSoundboard: {
			displayName(): string {
				return `Use Soundboard`;
			},
		},
		UseExternalSounds: {
			displayName(): string {
				return `Use External Sounds`;
			},
		},
		SendVoiceMessages: {
			displayName(): string {
				return `Send Voice Messages`;
			},
		},
	};
}
