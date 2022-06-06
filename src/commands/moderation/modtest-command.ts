import { CommandInteraction, Message, PermissionString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10.js';

export class ModTestCommand implements Command {
	public name = `modtest`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `mod test`;
	public slashDescription = `mod test`;
	public commandType = CommandType.Both;
	public usage = `modtest | /modtest`;
	public website = `https://www.bentobot.xyz/commands#cat`;
	public category = `modtest`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `modtest`,
		description: this.slashDescription,
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
