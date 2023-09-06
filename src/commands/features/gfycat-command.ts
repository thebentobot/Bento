import { CommandInteraction, Message, PermissionsString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import * as dotenv from 'dotenv';
dotenv.config();

export class GfycatCommand implements Command {
	public name = `gfycat`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Various Gfycat features. Create GIFs with video URLs or video attachments, get gfycat user profiles or feeds, get info about a gfycat post, or search for gfycat posts just like the gif command.`;
	public slashDescription = `${config.botName}'s Gfycat integration`;
	public commandType = CommandType.Both;
	public usage = `create <video url, or attachment> [--full if you want the whole video as a gif. If this is added, no need to specify start seconds and duration] <seconds to start at> <duration of the gif> [title of your gfycat post]\ngfycat user profile <gfycat username>\ngfycat user feed <gfycat username> [count number between 1-30]\ngfycat info <gfycat post name e.g. naiveamusingfritillarybutterfly>\ngfycat search <search input> [--multi [--count <number between 1-30>]] | /gfycat`;
	public website = `https://www.bentobot.xyz/commands#gfycat`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `gfycat`,
		description: this.slashDescription,
		options: [
			{
				name: `create`,
				description: `Create a gfycat`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `url`,
						description: `Video URL for your gfy`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
					{
						name: `attachment`,
						description: `Video attachment for your gfy`,
						type: ApplicationCommandOptionType.Attachment.valueOf(),
					},
					{
						name: `full`,
						description: `Gfycat of the whole video length`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
					{
						name: `start`,
						description: `Second the video starts at`,
						type: ApplicationCommandOptionType.Number.valueOf(),
					},
					{
						name: `duration`,
						description: `Duration of the gfycat. Does accept decimals`,
						type: ApplicationCommandOptionType.Number.valueOf(),
					},
					{
						name: `title`,
						description: `Title of the gfycat post`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
				],
			},
			{
				name: `user`,
				description: `Gfycat user commands`,
				type: ApplicationCommandOptionType.SubcommandGroup.valueOf(),
				options: [
					{
						name: `profile`,
						description: `Check gfycat user profile information`,
						type: ApplicationCommandOptionType.Subcommand.valueOf(),
						options: [
							{
								name: `name`,
								description: `Username of the gfycat user`,
								type: ApplicationCommandOptionType.String.valueOf(),
								required: true,
							},
						],
					},
					{
						name: `feed`,
						description: `Check gfycats by a user`,
						type: ApplicationCommandOptionType.Subcommand.valueOf(),
						options: [
							{
								name: `username`,
								description: `Username of the gfycat user`,
								type: ApplicationCommandOptionType.String.valueOf(),
								required: true,
							},
							{
								name: `posts`,
								description: `Amount of gfy posts to show. Max 30`,
								type: ApplicationCommandOptionType.Number.valueOf(),
								required: true,
							},
						],
					},
				],
			},
			{
				name: `info`,
				description: `Check metadata for a gfy`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `post`,
						description: `Name of the gfycat post`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `search`,
				description: `Search for gfycat posts`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `input`,
						description: `Search input to find gfycat posts`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
					{
						name: `amount`,
						description: `Amount of gfycat posts to show. Max 50`,
						type: ApplicationCommandOptionType.Number.valueOf(),
					},
				],
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		await InteractionUtils.send(
			intr,
			`Gfycat has shutdown as a service from September 1st. I'm sorry.\nRead more here https://techcrunch.com/2023/07/05/gfycat-shuts-down-on-september-1/`,
		);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		await MessageUtils.send(
			msg.channel,
			`Gfycat has shutdown as a service from September 1st. I'm sorry.\nRead more here https://techcrunch.com/2023/07/05/gfycat-shuts-down-on-september-1/`,
		);
		return;
	}
}
