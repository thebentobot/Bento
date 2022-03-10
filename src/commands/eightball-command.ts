import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../models/internal-models.js';
import { CommandUtils, MessageUtils, stylingUtils } from '../utils/index.js';
import { Command, CommandDeferType } from './command.js';
import { InteractionUtils } from '../utils/interaction-utils.js';

export class Ball8Command implements Command {
	public name = `eightball`;
	public metadata: ChatInputApplicationCommandData = {
		name: `eightball`,
		description: `Ask Bento a question and you will get an answer`,
		options: [
			{
				name: `input`,
				description: `What you're asking Bento about`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true
			}
		]
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		if (!intr.options.get(`input`)) {
			await InteractionUtils.send(intr, `${intr.user} Ask me something!`);
			return;
		} else {
			const command = await this.ball8Command();
			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setDescription(`${intr.user} **asked:** ${intr.options.get(`input`)?.value}\n${intr.client.user} **answers:** ${command}`);
			await InteractionUtils.send(intr, embed);
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			await MessageUtils.send(msg.channel, `${msg.author} Ask me something!`);
			return;
		} else {
			const command = await this.ball8Command();
			await MessageUtils.send(msg.channel, command);
			return;
		}
	}

	private async ball8Command(): Promise<string> {
		const answers = CommandUtils.ball8Answers();
		return answers[Math.floor(Math.random() * answers.length)];
	}
}