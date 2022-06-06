import { CommandInteraction, Message, MessageEmbed, PermissionString } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { CommandUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';

export class EightBallCommand implements Command {
	public name = `eightball`;
	public aliases = [`8ball`];
	public slashDescription = `Ask ${config.botName} a question and you will get an answer`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `eightball`,
		description: this.slashDescription,
		options: [
			{
				name: `input`,
				description: `What you're asking ${config.botName} about`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true,
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Ask ${config.botName} a question and you will get an answer`;
	public usage = `eightball <question> | /eightball <question>`;
	public website = `https://www.bentobot.xyz/commands#8ball`;
	public category = `features`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = this.ball8Command();
		const embed = new MessageEmbed()
			.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ format: `png` }) as string)}`)
			.setDescription(
				`${intr.user} **asked:** ${intr.options.get(`input`)?.value}\n${intr.client.user} **answers:** ${command}`,
			);
		await InteractionUtils.send(intr, embed);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			await MessageUtils.send(msg.channel, `${msg.author} Ask me something!`);
			return;
		} else {
			const command = this.ball8Command();
			await MessageUtils.send(msg.channel, command);
			return;
		}
	}

	private ball8Command(): string {
		const answers = CommandUtils.ball8Answers();
		return answers[Math.floor(Math.random() * answers.length)];
	}
}
