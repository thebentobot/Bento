import { RESTJSONErrorCodes as DiscordApiErrors } from 'discord-api-types/v9';
import {
	CommandInteraction,
	DiscordAPIError,
	InteractionReplyOptions,
	Message,
	MessageComponentInteraction,
	MessageEditOptions,
	EmbedBuilder,
	BaseMessageOptions,
	InteractionResponse,
} from 'discord.js';

import { MessageUtils } from './index.js';

const IGNORED_ERRORS = [
	DiscordApiErrors.UnknownMessage,
	DiscordApiErrors.UnknownChannel,
	DiscordApiErrors.UnknownGuild,
	DiscordApiErrors.UnknownUser,
	DiscordApiErrors.UnknownInteraction,
	DiscordApiErrors.CannotSendMessagesToThisUser, // User blocked bot or DM disabled
	DiscordApiErrors.ReactionWasBlocked, // User blocked bot or DM disabled
];

export class InteractionUtils {
	public static async deferReply(
		intr: CommandInteraction | MessageComponentInteraction,
		hidden = false,
	): Promise<void | InteractionResponse<boolean>> {
		try {
			return await intr.deferReply({
				ephemeral: hidden,
			});
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async deferUpdate(intr: MessageComponentInteraction): Promise<void | InteractionResponse<boolean>> {
		try {
			return await intr.deferUpdate();
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async send(
		intr: CommandInteraction | MessageComponentInteraction,
		content: string | EmbedBuilder | InteractionReplyOptions,
		hidden = false,
	): Promise<Message | undefined> {
		try {
			const msgOptions = this.interactionReplyOptions(content);

			if (intr.deferred || intr.replied) {
				return (await intr.followUp({
					...msgOptions,
					ephemeral: hidden,
				})) as Message;
			} else {
				return (await intr.reply({
					...msgOptions,
					ephemeral: hidden,
					fetchReply: true,
				})) as Message;
			}
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async editReply(
		intr: CommandInteraction | MessageComponentInteraction,
		content: string | EmbedBuilder | BaseMessageOptions,
	): Promise<Message | undefined> {
		try {
			const msgOptions = MessageUtils.messageOptions(content);
			return (await intr.editReply({
				...msgOptions,
			})) as Message;
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	public static async update(
		intr: MessageComponentInteraction,
		content: string | EmbedBuilder | MessageEditOptions,
	): Promise<Message | undefined> {
		try {
			const msgOptions = MessageUtils.messageEditOptions(content);
			return (await intr.update({
				...msgOptions,
				fetchReply: true,
			})) as Message;
		} catch (error) {
			if (error instanceof DiscordAPIError && IGNORED_ERRORS.includes(Number(error.code))) {
				return;
			} else {
				throw error;
			}
		}
	}

	private static interactionReplyOptions(
		content: string | EmbedBuilder | InteractionReplyOptions,
	): InteractionReplyOptions {
		let options: InteractionReplyOptions = {};
		if (typeof content === `string`) {
			options.content = content;
		} else if (content instanceof EmbedBuilder) {
			options.embeds = [content];
		} else {
			options = content;
		}
		return options;
	}
}
