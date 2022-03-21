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

export class DogCommand implements Command {
	public name = `dog`;
	public metadata: ChatInputApplicationCommandData = {
		name: `dog`,
		description: `Make ${config.botName} a random dog`
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.dogCommand();
		await InteractionUtils.send(intr, command);
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.dogCommand();
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async dogCommand(): Promise<string> {
		const dogData = await axios.get(`https://dog.ceo/api/breeds/image/random`);
		return dogData.data.message;
	}
}