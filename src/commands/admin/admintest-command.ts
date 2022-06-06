import {
	CommandInteraction,
	Message,
	PermissionString,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';

export class AdminTestCommand implements Command {
	public name = `admintest`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `admin test`;
	public slashDescription = `admin test`;
	public commandType = CommandType.Both;
	public usage = `admintest | /admintest`;
	public website = `https://www.bentobot.xyz/commands#cat`;
	public category = `admin`;
	public metadata = {
		name: `admintest`,
		description: this.slashDescription
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const command = await this.catCommand();
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		const command = await this.catCommand();
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async catCommand(): Promise<string> {
		const catData = `test`;
		return catData;
	}
}