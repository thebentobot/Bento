import { CommandInteraction, Message, PermissionString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import axios from 'axios';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

export class DogCommand implements Command {
	public name = `dog`;
	public slashDescription = `Make ${config.botName} send a random dog`;
	public commandType = CommandType.Both;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `dog`,
		description: this.slashDescription,
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Make ${config.botName} send a random dog 🐶🥺`;
	public usage = `dog | /dog`;
	public website = `https://www.bentobot.xyz/commands#dog`;
	public category = `features`;

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
