import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';

export class ChooseCommand implements Command {
	public name = `choose`;
	public metadata: ChatInputApplicationCommandData = {
		name: `choose`,
		description: `Make ${config.botName} choose one of the options`,
		options: [
			{
				name: `options`,
				description: `What you're asking ${config.botName} about`,
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
		const optionsContent = intr.options.get(`options`)?.value as string;
		const args = optionsContent.trim().split(` `);
		if (args.length < 2) {
			await InteractionUtils.send(intr, `${intr.member} Well obviously the choice is **${args[0]}**, but perhaps you wanted me to choose between a few more options other than one? 🙄`);
			return;
		} else if (args.length > 20) {
			await InteractionUtils.send(intr, `${intr.member} Too many choices 🤨`);
			return;
		} else {
			const command = await this.chooseCommand(args);
			const embed = new MessageEmbed()
				.setColor(`#${await stylingUtils.urlToColours(intr.client.user?.avatarURL({ format: `png` }) as string)}`)
				.setTitle(`I've chosen ${command}`)
				.setDescription(`The choices were:\n${args.join(`, `)}`);
			await InteractionUtils.send(intr, embed);
			return;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			await MessageUtils.send(msg.channel, `${msg.author} Give me some options!`);
			return;
		} else if (args.length < 2) {
			await MessageUtils.send(msg.channel, `${msg.author} Well obviously the choice is **${args[0]}**, but perhaps you wanted me to choose between a few more options other than one? 🙄`);
			return;
		} else if (args.length > 20) {
			await MessageUtils.send(msg.channel, `${msg.author} Too many choices 🤨`);
			return;
		} else {
			const command = await this.chooseCommand(args);
			await MessageUtils.send(msg.channel, command);
			return;
		}
	}

	private async chooseCommand(args: string[]): Promise<string> {
		return args[Math.floor(Math.random() * args.length)];
	}
}