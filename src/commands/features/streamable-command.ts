import { CommandInteraction, Message, PermissionsString, User, EmbedBuilder } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { CommandUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';

const streamableAPI = axios.create({
	baseURL: `https://api.streamable.com/`,
});

export class StreamableCommand implements Command {
	public name = `streamable`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Get a Streamable link of your desired video. There is a 250 MB / 10 minute / up to 720p 60 fps limit per video.\nAttachments for slash commands are currently not possible. Will be implemented when possible.`;
	public slashDescription = `Get a Streamable link of your desired video`;
	public commandType = CommandType.Both;
	public usage = `streamable <valid video URL or attachment> [title for the video]\n/streamable <valid video URL or attachment> [title for the video]`;
	public website = `https://www.bentobot.xyz/commands#streamable`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `streamable`,
		description: this.slashDescription,
		options: [
			{
				name: `video`,
				description: `Video URL you want to make a streamable of`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true,
			},
			{
				name: `title`,
				description: `title for the video`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: false,
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const videoURL = intr.options.get(`video`)?.value as string;
		const videoTitle = typeof (intr.options.get(`title`)?.value as string | undefined) === `undefined` ? `${intr.user.username}'s Streamable Video` : (intr.options.get(`title`)?.value as string);
		const command = await this.streamableCommand(intr.user, {type: `interaction`, context: intr}, videoURL, videoTitle);
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		let url: string;
		let title: string;
		let titleMessage: string;
		if (msg.attachments.size > 0) {
			const getUrl = [...msg.attachments.values()];
			url = getUrl[0] ? getUrl[0].url : ``;
			titleMessage = args.slice(0).join(` `);
			title = titleMessage.length > 0 ? titleMessage : `${msg.author.username}'s Streamable Video`;
		} else {
			url = args[0];
			if (!url) {
				await MessageUtils.send(msg.channel, `${msg.author} You need to insert an URL to make a streamable of`);
				return;
			};
			titleMessage = args.slice(1).join(` `);
			title = titleMessage.length > 0 ? titleMessage : `${msg.author.username}'s Streamable Video`;
		}
		const command = await this.streamableCommand(msg.member?.user as User, {type: `message`, context: msg}, url, title);
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async streamableCommand(user: User, request: {type: `interaction` | `message`, context: Message | CommandInteraction}, videoURL: string, videoTitle?: string): Promise<string> {
		const response = await streamableAPI
			.get(`import?url=${videoURL}&title=${videoTitle}`, {
				auth: {
					username: process.env.streamableUsername as string,
					password: process.env.streamablePassword as string,
				},
			});
		if (response?.data.status === 1) {
			const embed = new EmbedBuilder().setDescription(`Waiting for Streamable to process the video... ⌛`);
			const waitingMessage = request.type === `interaction` ? await InteractionUtils.send((request.context as CommandInteraction), embed) : await MessageUtils.send((request.context as Message).channel, embed);
			let streamableStatus = false;
			let TMRError = false;
			let loopCount = 0; // adding seconds to each attempt, to avoid TMR

			while (streamableStatus === false) {
				switch (loopCount) {
				case 0:
				case 1:
					await CommandUtils.sleep(60000);
					break;
				default:
					await CommandUtils.sleep(120000);
				}
				if (loopCount === 1) {
					(waitingMessage as Message).edit(`Approx. 2 minutes has gone by since Streamable started processing the video ⌛`);
				}
				if (loopCount === 2) {
					(waitingMessage as Message).edit(`Approx. 4 minutes has gone by since Streamable started processing the video... ⌛🥱`);
				}
				if (loopCount === 3) {
					(waitingMessage as Message).edit(`Approx. 6 minutes has gone by since Streamable started processing the video ⌛😴`);
				}
				if (loopCount === 4) {
					(waitingMessage as Message).edit(`Approx. 8 minutes has gone by since Streamable started processing the video... ⚰️`);
				}
				if (loopCount === 5) {
					(waitingMessage as Message).edit(
						`Approx. 10 minutes has gone by since Streamable started processing the video and I don't bother counting anymore 😒`,
					);
				}
				++loopCount;
				const percentData = await streamableAPI.get(`videos/${response.data?.shortcode}`, {
					auth: {
						username: process.env.streamableUsername as string,
						password: process.env.streamablePassword as string,
					},
				});
				if (percentData.status === 429) {
					TMRError = true;
					break;
				}
				if (percentData.data?.status === 2) {
					streamableStatus = true;
					break;
				}
			}

			if (TMRError === true || streamableStatus === false) {
				request.type === `interaction` ? await (waitingMessage as Message).edit(`Processing of the video is finished 😬`)  : await (waitingMessage as Message).delete();
				return `${user} Error - Too many requests 😔 either your video is too big or Streamable is just stressed 🥺 I am sorry.`;
			} else {
				request.type === `interaction` ? await (waitingMessage as Message).edit(`Processing of the video is finished 🎉`)  : await (waitingMessage as Message).delete();
				return `${user} your streamable is done now! https://streamable.com/${response.data?.shortcode}`;
			}
		} else {
			return `${user} Either your URL was invalid, or Streamable doesn't answer right now, try again 😔`;
		}
	}
}
