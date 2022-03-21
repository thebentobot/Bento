import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	Message,
	PermissionString,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import axios from 'axios';

export class CatCommand implements Command {
	public name = `cat`;
	public metadata: ChatInputApplicationCommandData = {
		name: `cat`,
		description: `Make ${config.botName} send a random cat`
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.catCommand();
		await InteractionUtils.send(intr, command);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.catCommand();
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async catCommand(): Promise<string> {
		const catData = await axios.get(`http://aws.random.cat/meow`);
		return catData.data.file;
	}
}