import { CommandInteraction, EmbedAuthorData, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';

export class RollCommand implements Command {
	public name = `roll`;
	public slashDescription = `Roll a random number between two numbers`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `roll`,
		description: this.slashDescription,
		options: [
			{
				name: `number`,
				description: `Pick a number for ${config.botName} to roll with`,
				type: ApplicationCommandOptionType.Integer.valueOf(),
				required: true,
			},
		],
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Make ${config.botName} roll a random number between 1 and the value you set (max. 100)`;
	public usage = `roll <number between 1-100> | /roll <number between 1-100>`;
	public website = `https://www.bentobot.xyz/commands#roll`;
	public category = `features`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const userNumber = intr.options.get(`number`)?.value as number;
		if (userNumber > 100) {
			await InteractionUtils.send(intr, `${intr.member} Give me a number between 1-100 😡`);
			return;
		}
		if (userNumber < 1) {
			await InteractionUtils.send(intr, `${intr.member} Give me a number between 1-100 😡`);
			return;
		}
		const command = this.rollCommand(userNumber);
		const authorData: EmbedAuthorData = {
			name: `I rolled between 1 and ${userNumber}...`,
			iconURL: intr.client.user?.avatarURL({ extension: `png` }) as string,
		};
		const embed = new EmbedBuilder()
			.setColor(await stylingUtils.urlToColours(intr.client.user?.avatarURL({ extension: `png` })))
			.setAuthor(authorData)
			.setTitle(`The rolled number is ${command}`);
		await InteractionUtils.send(intr, embed);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			await MessageUtils.send(msg.channel, `${msg.author} Give me a number between 1-100!`);
			return;
		}
		const userNumber: number = parseInt(args[0]);
		if (isNaN(userNumber)) {
			await MessageUtils.send(msg.channel, `${msg.author} That is not a number 🤣`);
			return;
		}
		if (userNumber > 100) {
			await MessageUtils.send(msg.channel, `${msg.author} Give me a number between 1-100 😡`);
			return;
		}
		if (userNumber < 1) {
			await MessageUtils.send(msg.channel, `${msg.author} Give me a number between 1-100 😡`);
			return;
		}
		const command = this.rollCommand(userNumber);
		await MessageUtils.send(msg.channel, `${command}`);
		return;
	}

	private rollCommand(rollNumber: number): number {
		return Math.floor(Math.random() * (rollNumber - 1 + 1) + 1);
	}
}
