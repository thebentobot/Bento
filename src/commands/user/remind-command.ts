import { CommandInteraction, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { EventData } from '../../models/internal-models.js';
import { CommandUtils, MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';

export class RemindCommand implements Command {
	public name = `remind`;
	public aliases = [`reminder`];
	public slashDescription = `Get a reminder from ${config.botName}`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `remind`,
		description: this.slashDescription,
		/* you can add years, months, days, hours and minutes */
		// a sub command that directly schedules by date
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
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Create reminders and you will receive a message reminder from Bento at your desired time.\nYou can either use time and say remind me in a day, or use schedule to specify a specific time. Use list to see a list of your reminders.`;
	public usage = `**reminder time <amount of time> <timeframe> <reminder>** E.g. reminder time 1 day eat cake\n**reminder schedule <DD-MM-YYYY> <HH:mm> <timezone offset> <reminder>** E.g. reminder schedule 25-11-2021 08:00 +02:00 eat cake\n**remind list** to see a list of your reminders | /remind`;
	public website = `https://www.bentobot.xyz/commands#remind`;
	public category = `user`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = this.ball8Command();
		const embed = new EmbedBuilder()
			.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ extension: `png` }) as string)}`)
			.setDescription(
				`${intr.user} **asked:** ${intr.options.get(`input`)?.value}\n${intr.client.user} **answers:** ${command}`,
			);
		await InteractionUtils.send(intr, embed);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		// copy paste the bentots reminder command basically, i cba.
		if (!args.length) {
			await MessageUtils.send(msg.channel, `${msg.author} Ask me something!`);
			return;
		} else {
			const command = this.ball8Command();
			await MessageUtils.send(msg.channel, command);
			return;
		}
	}
	// solely executeIntr() no msg shit
	private ball8Command(): string {
		const answers = CommandUtils.ball8Answers();
		return answers[Math.floor(Math.random() * answers.length)];
	}
}
