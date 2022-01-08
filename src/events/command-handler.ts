import { CommandInteraction, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventHandler } from '.';
import { Command } from '../commands';
import { EventData } from '../models/internal-models';
import { Logger } from '../services';
import { CommandUtils, MessageUtils } from '../utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const Config = require(`../../config/config.json`);
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Logs = require(`../../lang/logs.json`);

export class CommandHandler implements EventHandler {
	private rateLimiter = new RateLimiter(
		Config.rateLimiting.commands.amount,
		Config.rateLimiting.commands.interval * 1000,
	);

	constructor(public commands: Command[]) {}

	public async process(intr: CommandInteraction): Promise<void> {
		// Check if user is rate limited
		const limited = this.rateLimiter.take(intr.user.id);
		if (limited) {
			return;
		}

		// Defer interaction
		// NOTE: Anything after this point we should be responding to the interaction
		await intr.deferReply();

		// TODO: Get data from database
		const data = new EventData();

		// Try to find the command the user wants
		const command = this.commands.find((command) => command.metadata.name === intr.commandName);
		if (!command) {
			await this.sendError(intr, data);
			Logger.error(
				Logs.error.commandNotFound
					.replaceAll(`{INTERACTION_ID}`, intr.id)
					.replaceAll(`{COMMAND_NAME}`, intr.commandName),
			);
			return;
		}

		try {
			// Check if interaction passes command checks
			const passesChecks = await CommandUtils.runChecks(command, intr, data);
			if (passesChecks) {
				// Execute the command
				await command.execute(intr, data);
			}
		} catch (error) {
			await this.sendError(intr, data);

			// Log command error
			Logger.error(
				intr.channel instanceof TextChannel ||
					intr.channel instanceof NewsChannel ||
					intr.channel instanceof ThreadChannel
					? Logs.error.commandGuild
						.replaceAll(`{INTERACTION_ID}`, intr.id)
						.replaceAll(`{COMMAND_NAME}`, command.metadata.name)
						.replaceAll(`{USER_TAG}`, intr.user.tag)
						.replaceAll(`{USER_ID}`, intr.user.id)
						.replaceAll(`{CHANNEL_NAME}`, intr.channel.name)
						.replaceAll(`{CHANNEL_ID}`, intr.channel.id)
						.replaceAll(`{GUILD_NAME}`, intr.guild?.name)
						.replaceAll(`{GUILD_ID}`, intr.guild?.id)
					: Logs.error.commandOther
						.replaceAll(`{INTERACTION_ID}`, intr.id)
						.replaceAll(`{COMMAND_NAME}`, command.metadata.name)
						.replaceAll(`{USER_TAG}`, intr.user.tag)
						.replaceAll(`{USER_ID}`, intr.user.id),
				error,
			);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	private async sendError(intr: CommandInteraction, _data: EventData): Promise<void> {
		try {
			const embed = new MessageEmbed()
				.setDescription(`Something went wrong!`)
				.addField(`Error code`, intr.id)
				.addField(`Contact support`, `[Support Server](https://discord.gg/dd68WwP)`)
				.setColor(`#ff4a4a`);
			await MessageUtils.sendIntr(
				intr,
				embed,
			);
		} catch {
			// Ignore
		}
	}
}
