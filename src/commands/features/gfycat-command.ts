import {
	CommandInteraction,
	EmbedAuthorData,
	HexColorString,
	Message,
	EmbedBuilder,
	PermissionsString,
	TextChannel,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { CommandUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import axios from 'axios';
import {
	ApplicationCommandOptionType,
	ButtonStyle,
	ComponentType,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import {
	gfycatErrorMessage,
	gfycatSearchInterface,
	gfycatSingleGfycatInterface,
	gfycatUserDataInterface,
	gfycatUserFeedInterface,
} from '../../interfaces/gfycat.js';
import { createRequire } from 'module'; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url);
const naughtyWords = require(`naughty-words/en.json`);
import utf8 from 'utf8';
import { botColours, stylingUtils } from '../../utils/styling-utils.js';
import * as dotenv from 'dotenv';
import { prisma } from '../../services/prisma.js';
dotenv.config();

const gfycatAPI = axios.create({
	baseURL: `https://api.gfycat.com/v1/`,
});

export let gfycatToken: string;

async function newToken() {
	const gfycatAuthData = await axios.post(`https://api.gfycat.com/v1/oauth/token`, {
		client_id: `${process.env.gfycatclientID}`,
		client_secret: `${process.env.gfycatsecret}`,
		grant_type: `client_credentials`,
	});
	console.log(`The Gfycat Access Token expires in 1 hour`);
	gfycatToken = gfycatAuthData.data.access_token;
}

newToken();

setInterval(newToken, 3600000);

interface IUserProfileCmd {
	error: boolean;
	embed?: EmbedBuilder | string;
	content?: string;
	pfpFile?: {
		image: Buffer;
		fileName: string;
	};
}

interface IGfycatSearch {
	error: boolean;
	embed?: EmbedBuilder | string;
	content?: string;
	embeds?: string[];
	multi?: boolean;
}

interface gfycatUserFeedEmbed {
	error: boolean;
	message?: string | EmbedBuilder;
	gfycatEmbedId?: string;
	embeds?: string[];
}

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
		let cmd: EmbedBuilder | string | IUserProfileCmd | gfycatUserFeedEmbed | IGfycatSearch = ``;
		let userProfile = false;
		let userFeed = false;
		let getGfycat = false;
		let searchGfycat = false;
		if (intr.options.data[0].name === `create`) {
			cmd = await this.createGfycat(
				true,
				intr,
				[``],
				intr.options.get(`url`)?.value as string,
				intr.options.get(`attachment`)?.attachment?.url,
				intr.options.get(`full`)?.value as boolean,
				intr.options.get(`start`)?.value as number,
				intr.options.get(`duration`)?.value as number,
				intr.options.get(`title`)?.value as string,
			);
		} else if (intr.options.data[0].name === `profile`) {
			cmd = await this.userProfile(intr, intr.options.get(`name`, true).value as string);
			userProfile = true;
		} else if (intr.options.data[0].name === `feed`) {
			cmd = await this.userFeed(
				true,
				intr,
				intr.options.get(`username`, true).value as string,
				`${intr.options.get(`posts`, true).value as number}`,
			);
			userFeed = true;
		} else if (intr.options.data[0].name === `info`) {
			cmd = await this.getGfycat(true, intr, intr.options.get(`post`, true).value as string);
			getGfycat = true;
		} else if (intr.options.data[0].name === `search`) {
			cmd = await this.searchGfycat(
				true,
				intr,
				[],
				intr.options.get(`input`, true).value as string,
				`${intr.options.get(`amount`)?.value as number}`,
			);
			searchGfycat = true;
		}

		if (userProfile) {
			if ((cmd as IUserProfileCmd).error === true) {
				await InteractionUtils.send(intr, cmd as string | EmbedBuilder);
				return;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await InteractionUtils.send(intr, {
					embeds: [(cmd as IUserProfileCmd).embed as EmbedBuilder],
					files: [
						{ name: (cmd as IUserProfileCmd).pfpFile!.fileName, attachment: (cmd as IUserProfileCmd).pfpFile!.image },
					],
				});
				return;
			}
		} else if (userFeed) {
			if ((cmd as gfycatUserFeedEmbed).error === true) {
				await InteractionUtils.send(intr, cmd as string | EmbedBuilder);
				return;
			} else {
				const message = await InteractionUtils.send(intr, `Finishing...`);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				for (const embed of (cmd as IGfycatSearch).embeds!) {
					await prisma.gfycatPosts.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							messageId: BigInt(message!.id),
							content: embed,
						},
					});
				}
				const gfycatData = await prisma.gfycatPosts.findMany({
					where: {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						messageId: BigInt(message!.id),
					},
				});
				await InteractionUtils.editReply(intr, {
					content: `Page 1/${gfycatData.length}\n${gfycatData[0].content}`,
					components: [
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									customId: `gfycatUserFeed_next`,
									emoji: `➡️`,
									style: ButtonStyle.Primary,
								},
								{
									type: ComponentType.Button,
									customId: `gfycatUserFeed_delete`,
									label: `Close embed`,
									style: ButtonStyle.Danger,
								},
							],
						},
					],
				});
				return;
			}
		} else if (getGfycat) {
			await InteractionUtils.send(intr, { content: (cmd as IUserProfileCmd).content });
			await InteractionUtils.send(intr, { embeds: [(cmd as IUserProfileCmd).embed as EmbedBuilder] });
			return;
		} else if (searchGfycat) {
			if ((cmd as IGfycatSearch).error === true) {
				await InteractionUtils.send(intr, cmd as string | EmbedBuilder);
				return;
			} else if ((cmd as IGfycatSearch).multi === true) {
				const message = await InteractionUtils.send(intr, `Finishing...`);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				for (const embed of (cmd as IGfycatSearch).embeds!) {
					await prisma.gfycatPosts.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							messageId: BigInt(message!.id),
							content: embed,
						},
					});
				}
				const gfycatData = await prisma.gfycatPosts.findMany({
					where: {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						messageId: BigInt(message!.id),
					},
				});
				await InteractionUtils.editReply(intr, {
					content: `Page 1/${gfycatData.length}\n${gfycatData[0].content}`,
					components: [
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									customId: `gfycatSearch_next`,
									emoji: `➡️`,
									style: ButtonStyle.Primary,
								},
								{
									type: ComponentType.Button,
									customId: `gfycatSearch_delete`,
									label: `Close embed`,
									style: ButtonStyle.Danger,
								},
							],
						},
					],
				});
				return;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await InteractionUtils.send(intr, { content: (cmd as IGfycatSearch).content });
				return;
			}
		} else {
			await InteractionUtils.send(intr, cmd as string | EmbedBuilder);
			return;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		let cmd: EmbedBuilder | string | IUserProfileCmd = ``;
		let userProfile = false;
		let userFeed = false;
		let getGfycat = false;
		let searchGfycat = false;
		if (!args.length) {
			await MessageUtils.send(msg.channel, `You need to write an argument.`);
			return;
		} else {
			switch (args[0]) {
				case `upload`:
				case `create`:
					{
						cmd = await this.createGfycat(false, msg, args);
					}
					break;
				case `user`:
					switch (args[1]) {
						case `profile`:
							{
								cmd = await this.userProfile(msg, args[2]);
								userProfile = true;
							}
							break;
						case `feed`:
						case `gfycats`:
						case `gfys`:
							{
								cmd = await this.userFeed(false, msg, args[2], args[3]);
								userFeed = true;
							}
							break;
					}
					break;
				case `get`:
				case `info`:
					{
						cmd = await this.getGfycat(false, msg, args[1]);
						getGfycat = true;
					}
					break;
				case `search`:
					{
						cmd = await this.searchGfycat(false, msg, args);
						searchGfycat = true;
					}
					break;
			}
		}
		if (userProfile) {
			if ((cmd as IUserProfileCmd).error === true) {
				await MessageUtils.send(msg.channel, cmd as string | EmbedBuilder);
				return;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(msg.channel, {
					embeds: [(cmd as IUserProfileCmd).embed as EmbedBuilder],
					files: [
						{ name: (cmd as IUserProfileCmd).pfpFile!.fileName, attachment: (cmd as IUserProfileCmd).pfpFile!.image },
					],
				});
				return;
			}
		} else if (userFeed) {
			if ((cmd as gfycatUserFeedEmbed).error === true) {
				await MessageUtils.send(msg.channel, cmd as string | EmbedBuilder);
				return;
			} else {
				const message = await MessageUtils.send(msg.channel, `Finishing...`);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				for (const embed of (cmd as IGfycatSearch).embeds!) {
					await prisma.gfycatPosts.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							messageId: BigInt(message!.id),
							content: embed,
						},
					});
				}
				const gfycatData = await prisma.gfycatPosts.findMany({
					where: {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						messageId: BigInt(message!.id),
					},
				});
				await MessageUtils.edit(msg, {
					content: `Page 1/${gfycatData.length}\n${gfycatData[0].content}`,
					components: [
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									customId: `gfycatUserFeed_next`,
									emoji: `➡️`,
									style: ButtonStyle.Primary,
								},
								{
									type: ComponentType.Button,
									customId: `gfycatUserFeed_delete`,
									label: `Close embed`,
									style: ButtonStyle.Danger,
								},
							],
						},
					],
				});
				return;
			}
		} else if (getGfycat) {
			if ((cmd as IUserProfileCmd).error === true) {
				await MessageUtils.send(msg.channel, cmd as string | EmbedBuilder);
				return;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(msg.channel, {
					embeds: [(cmd as IUserProfileCmd).embed as EmbedBuilder],
					content: (cmd as IUserProfileCmd).content,
					files: [
						{ name: (cmd as IUserProfileCmd).pfpFile!.fileName, attachment: (cmd as IUserProfileCmd).pfpFile!.image },
					],
				});
				return;
			}
		} else if (searchGfycat) {
			if ((cmd as IGfycatSearch).error === true) {
				await MessageUtils.send(msg.channel, cmd as string | EmbedBuilder);
				return;
			} else if ((cmd as IGfycatSearch).multi === true) {
				const message = await MessageUtils.send(msg.channel, `Finishing...`);
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				for (const embed of (cmd as IGfycatSearch).embeds!) {
					await prisma.gfycatPosts.create({
						data: {
							// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
							messageId: BigInt(message!.id),
							content: embed,
						},
					});
				}
				const gfycatData = await prisma.gfycatPosts.findMany({
					where: {
						// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
						messageId: BigInt(message!.id),
					},
				});
				await MessageUtils.edit(msg, {
					content: `Page 1/${gfycatData.length}\n${gfycatData[0].content}`,
					components: [
						{
							type: ComponentType.ActionRow,
							components: [
								{
									type: ComponentType.Button,
									customId: `gfycatSearch_next`,
									emoji: `➡️`,
									style: ButtonStyle.Primary,
								},
								{
									type: ComponentType.Button,
									customId: `gfycatSearch_delete`,
									label: `Close embed`,
									style: ButtonStyle.Danger,
								},
							],
						},
					],
				});
				return;
			} else {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				await MessageUtils.send(msg.channel, { content: (cmd as IGfycatSearch).content });
				return;
			}
		} else {
			await MessageUtils.send(msg.channel, cmd as string | EmbedBuilder);
			return;
		}
	}

	private async searchGfycat(
		interaction: boolean,
		message: Message | CommandInteraction,
		args: string[],
		input?: string,
		amount?: string,
	): Promise<IGfycatSearch> {
		if (interaction === false) {
			const msg = message as Message;
			const channelObject = msg.channel as TextChannel;

			let messageParse: string[] = args;

			let returnMultipleGifs = false;

			let count = 30;

			messageParse.shift();

			if (args.includes(`--multi`)) {
				let getNumber = args.join(` `);
				if (args.includes(`--count`)) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					getNumber = getNumber.match(/\d+/)!.pop() as string;
					count = parseInt(getNumber);
					if (count > 50)
						return {
							error: true,
							embed: new EmbedBuilder()
								.setTitle(`Error`)
								.setColor(botColours.error)
								.setDescription(`50 posts is the maximum`),
						};
				}
				messageParse = args.filter((msg) => msg !== `--multi` && msg !== `--count` && msg !== getNumber);
				returnMultipleGifs = true;
			}

			const blacklistData = await prisma.gfycatBlacklist.findMany();
			const wordListData = await prisma.gfycatWordList.findMany();

			const badWordCheck = messageParse.map((message) => message.toLowerCase());

			if (badWordCheck.some((msg) => naughtyWords.includes(msg)))
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${messageParse.join(` `)}\`.`),
				};

			if (badWordCheck.some((msg) => wordListData.some((badWord) => badWord.word === msg)))
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${messageParse.join(` `)}\`.`),
				};
			const query: string = messageParse.join(` `);
			const response = await gfycatAPI.get<gfycatSearchInterface>(`gfycats/search`, {
				params: {
					search_text: utf8.encode(query),
					count: returnMultipleGifs === true ? count : 50,
				},
				headers: { Authorization: `Bearer ${gfycatToken}` },
			});
			if (!response.data.gfycats.length) {
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${query}\`.`),
				};
			} else {
				let gfycatData = response.data.gfycats;

				if (channelObject.nsfw !== true) {
					gfycatData = gfycatData.filter((gfy) => gfy.nsfw === `0`);
					gfycatData = gfycatData.filter((gfyUser) => {
						return !blacklistData.some((user) => user.username === `${gfyUser.userData?.username}`);
					});
				}

				if (returnMultipleGifs === false) {
					const waitingMessage = await InteractionUtils.send(
						message as CommandInteraction,
						`Loading a random Gfycat Post related to \`${query}\` ... ⌛🐱`,
					);
					let index = Math.floor(Math.random() * gfycatData.length);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let gfyTest: any;
					await axios
						.get(gfycatData[index].mobileUrl)
						.then((res) => {
							gfyTest = res;
						})
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						.catch(() => {});
					while (gfyTest?.status !== 200) {
						gfycatData = gfycatData.filter((gfy) => gfy.userData.username !== gfycatData[index].userData.username);
						index = Math.floor(Math.random() * gfycatData.length);
						await axios
							.get(gfycatData[index].mobileUrl)
							.then((res) => {
								gfyTest = res;
							})
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							.catch(() => {});
					}
					(waitingMessage as Message).delete();
					return { error: true, content: `https://gfycat.com/${gfycatData[index].gfyName}` };
				} else {
					const waitingMessage = await MessageUtils.send(
						(message as Message).channel,
						`Loading the multiple Gfycat Posts related to \`${query}\` ... ⌛🐱`,
					);
					const embeds = await this.generateGfyCatEmbed(gfycatData);
					(waitingMessage as Message).delete();
					if (!embeds.length)
						return {
							error: true,
							embed: new EmbedBuilder()
								.setTitle(`Error`)
								.setColor(botColours.error)
								.setDescription(`No GIFs found based on your search input \`${query}\`.`),
						};
					return { error: false, embeds: embeds, multi: true };
				}
			}
		} else {
			if (!input) {
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`You need to provide a search input!`),
				};
			}
			const channelObject = (message as CommandInteraction).channel as TextChannel;
			const amountNumber = amount ? Number(amount) : 0;

			const messageParse: string[] = input.trim().split(` `);

			const blacklistData = await prisma.gfycatBlacklist.findMany();
			const wordListData = await prisma.gfycatWordList.findMany();

			const badWordCheck = messageParse.map((message) => message.toLowerCase());

			if (badWordCheck.some((msg) => naughtyWords.includes(msg)))
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${messageParse.join(` `)}\`.`),
				};

			if (badWordCheck.some((msg) => wordListData.some((badWord) => badWord.word === msg)))
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${messageParse.join(` `)}\`.`),
				};
			const query: string = messageParse.join(` `);
			const response = await gfycatAPI.get<gfycatSearchInterface>(`gfycats/search`, {
				params: {
					search_text: utf8.encode(query),
					count: amountNumber === 0 ? 30 : amount,
				},
				headers: { Authorization: `Bearer ${gfycatToken}` },
			});
			if (!response.data.gfycats.length) {
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`No GIFs found based on your search input \`${query}\`.`),
				};
			} else {
				let gfycatData = response.data.gfycats;
				if (channelObject.nsfw !== true) {
					gfycatData = gfycatData.filter((gfy) => gfy.nsfw === `0`);
					gfycatData = gfycatData.filter((gfyUser) => {
						return !blacklistData.some((user) => user.username === `${gfyUser.userData?.username}`);
					});
				}
				if (amountNumber === 0) {
					if (!gfycatData.length)
						return {
							error: true,
							embed: new EmbedBuilder()
								.setTitle(`Error`)
								.setColor(botColours.error)
								.setDescription(`No GIFs found based on your search input \`${query}\`.`),
						};
					let index = Math.floor(Math.random() * gfycatData.length);
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					let gfyTest: any;
					await axios
						.get(gfycatData[index].mobileUrl)
						.then((res) => {
							gfyTest = res;
						})
						// eslint-disable-next-line @typescript-eslint/no-empty-function
						.catch(() => {});
					while (gfyTest?.status !== 200) {
						gfycatData = gfycatData.filter((gfy) => gfy.userData.username !== gfycatData[index].userData.username);
						index = Math.floor(Math.random() * gfycatData.length);
						await axios
							.get(gfycatData[index].mobileUrl)
							.then((res) => {
								gfyTest = res;
							})
							// eslint-disable-next-line @typescript-eslint/no-empty-function
							.catch(() => {});
					}
					return { error: true, content: `https://gfycat.com/${gfycatData[index].gfyName}` };
				} else {
					const embeds = await this.generateGfyCatEmbed(gfycatData);
					if (!embeds.length)
						return {
							error: true,
							embed: new EmbedBuilder()
								.setTitle(`Error`)
								.setColor(botColours.error)
								.setDescription(`No GIFs found based on your search input \`${query}\`.`),
						};
					return { error: false, embeds: embeds, multi: true };
				}
			}
		}
	}

	private async createGfycat(
		interaction: boolean,
		msg: Message | CommandInteraction,
		args: string[],
		url?: string | null,
		attachment?: string | null,
		full?: boolean | null,
		start?: number | null,
		durationInSeconds?: number | null,
		title?: string | null,
	): Promise<EmbedBuilder | string> {
		let msgData: Message | CommandInteraction;
		let argsData: string[];
		let gfycatUrl = ``;
		let startSeconds = ``;
		let duration = ``;
		let caption = ``;
		if (interaction === false) {
			msgData = msg as Message;
			argsData = args;
			const getUrl = [...msgData.attachments.values()];

			if (!argsData[1] && !getUrl[0]) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You didn't attach any content to create a gfycat`);
			}

			gfycatUrl = getUrl[0] ? getUrl[0].url : argsData[1];
			if (argsData.includes(`--full`)) {
				startSeconds = ``;
				duration = ``;
				caption = getUrl[0]
					? args.slice(1).join(` `).replace(`--full`, ``).trim()
					: args.slice(2).join(` `).replace(`--full`, ``).trim();
			} else {
				startSeconds = getUrl[0] ? (args[1] ? args[1] : ``) : args[2] ? args[2] : ``;
				duration = getUrl[0] ? (args[2] ? args[2] : ``) : args[3] ? args[3] : ``;
				caption = getUrl[0] ? (args[3] ? args.slice(3).join(` `) : ``) : args[4] ? args.slice(4).join(` `) : ``;
			}
		} else {
			msgData = msg as CommandInteraction;
			if (!url && !attachment) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You didn't attach any content to create a gfycat`);
			}
			gfycatUrl = attachment ? attachment : (url as string);
			if (full) {
				startSeconds = ``;
				duration = ``;
			} else {
				// eslint-disable-next-line no-lonely-if
				if (!start) {
					return new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`You didn't specify which second to start the gif`);
				} else if (!durationInSeconds) {
					return new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`You didn't specify the duration for the gif`);
				} else {
					startSeconds = `${start}`;
					duration = `${durationInSeconds}`;
				}
			}
			caption = title ? title : ``;
		}

		const response = await gfycatAPI.post(
			`gfycats`,
			{
				fetchUrl: gfycatUrl,
				noMd5: true,
				cut: {
					start: startSeconds.length > 0 ? startSeconds : 0,
					duration: duration.length > 0 ? duration : 0,
				},
				title: caption.length > 0 ? caption : ``,
			},
			{
				headers: {
					Authorization: `Bearer ${gfycatToken}`,
					'Content-Type': `application/json`,
				},
			},
		);
		if (response.status !== 200)
			return new EmbedBuilder().setTitle(`Error`).setColor(botColours.error).setDescription(`Gfycat error.`);

		if (response.data.isOk === false) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Unable to create Gfycat Post 😭`);
		} else {
			const waitingMessage =
				interaction === true
					? ``
					: await MessageUtils.send((msgData as Message).channel, `Encoding your Gfycat Post... ⌛🐱`);
			let checkStatus = await gfycatAPI.get<{
				task: string;
				time?: number;
				gfyname?: string;
				errorMessage?: gfycatErrorMessage;
			}>(`gfycats/fetch/status/${response.data.gfyname}`, {
				headers: {
					Authorization: `Bearer ${gfycatToken}`,
					'Content-Type': `application/json`,
				},
			});
			while (checkStatus.data.task === `encoding`) {
				CommandUtils.sleep(30000);
				checkStatus = await gfycatAPI.get(`gfycats/fetch/status/${response.data.gfyname as string}`, {
					headers: { Authorization: `Bearer ${gfycatToken}` },
				});
			}

			if (checkStatus.data.task === `NotFoundo`) {
				interaction === true ? `` : await (waitingMessage as Message).delete();
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Error. Apparently the Gfycat Post wasn't found by Gfycat 🤔`);
			} else if (checkStatus.data.task === `error`) {
				interaction === true ? `` : await (waitingMessage as Message).delete();
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(
						`Error from Gfycat 😔 - ${checkStatus.data.errorMessage?.description}, Error code ${checkStatus.data.errorMessage?.code}`,
					);
			} else {
				interaction === true ? `` : await (waitingMessage as Message).delete();
				return `${
					interaction === true ? (msgData as CommandInteraction).user : (msgData as Message).author
				} your Gfycat Post is ready! 👏\nhttps://gfycat.com/${checkStatus.data.gfyname}`;
			}
		}
	}

	private async userProfile(message: Message | CommandInteraction, user: string): Promise<IUserProfileCmd> {
		if (!user) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You need to specify a user`),
			};
		}

		const blacklistData = await prisma.gfycatBlacklist.findMany();

		if (blacklistData.some((user) => user.username === `${user}`)) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Couldn't find \`${user}\``),
			};
		}

		const response = await gfycatAPI.get<gfycatUserDataInterface>(`users/${user}`, {
			headers: {
				Authorization: `Bearer ${gfycatToken}`,
				'Content-Type': `application/json`,
			},
		});
		if (response.status !== 200) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Gfycat error - couldn't find user`),
			};
		}
		const profilePicture = await axios({
			method: `post`,
			url: `http://${process.env.imageserverhost}:3000/url`,
			data: {
				url: response?.data.profileImageUrl,
				width: 200,
				height: 200,
				imageextension: `png`,
				quality: 75,
			},
			responseType: `arraybuffer`,
		}).then((res) => Buffer.from(res.data));

		const userAuthorData: EmbedAuthorData = {
			name: response?.data.verified ? `${response?.data.username} ✔️` : response?.data.username,
			iconURL: response?.data.profileImageUrl,
			url: response?.data.url,
		};
		const embed = new EmbedBuilder({ thumbnail: { url: `attachment://${response?.data.username}_gfypfp.png` } })
			.setAuthor(userAuthorData)
			.setColor(await stylingUtils.urlToColours(response?.data.profileImageUrl))
			.setTitle(response?.data.name)
			.setDescription(
				`${response.data.description ? `${response?.data.description}\n\n` : ``}Total Views: ${stylingUtils.nFormatter(
					response?.data.views,
					1,
				)}\nPublished Gfycats: ${stylingUtils.nFormatter(
					response.data.publishedGfycats,
					1,
				)}\nPublished Gfycat Albums: ${stylingUtils.nFormatter(
					response.data.publishedAlbums,
					1,
				)}\nFollowers: ${stylingUtils.nFormatter(response?.data.followers, 1)}\nFollowing: ${stylingUtils.nFormatter(
					response.data.following,
					1,
				)}\nAccount made on <t:${response?.data.createDate}:F>\nProfile URL: ${response?.data.profileUrl}`,
			);
		return {
			error: false,
			embed: embed,
			pfpFile: { image: profilePicture, fileName: `${response?.data.username}_gfypfp.png` },
		};
	}

	private async userFeed(
		interaction: boolean,
		message: Message | CommandInteraction,
		user: string,
		count: string,
	): Promise<gfycatUserFeedEmbed> {
		if (!user) {
			return {
				error: true,
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You need to specify a user`),
			};
		}

		const blacklistData = await prisma.gfycatBlacklist.findMany();

		if (blacklistData.some((user) => user.username === `${user}`)) {
			return {
				error: true,
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Couldn't find \`${user}\``),
			};
		}

		let insertCount = 30;

		if (count) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const getNumber = count.match(/\d+/)!.pop();
			insertCount = parseInt(getNumber as string);
			if (insertCount > 50)
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`Sorry, 50 posts is the max.`),
				};
		}
		const gfycatData = await gfycatAPI.get<gfycatUserFeedInterface | gfycatErrorMessage>(`users/${user}/gfycats`, {
			params: { count: insertCount },
			headers: {
				Authorization: `Bearer ${gfycatToken}`,
				'Content-Type': `application/json`,
			},
		});
		switch (gfycatData.status) {
			case 400:
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(`Error 400 - Required fields were invalid, or missing`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 401:
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(`Error 401 - The access token is invalid or has been revoked`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 403:
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(
							`Error 403 - The clientId does not have permission, or the userId in the request path points to wrong/non-existent user`,
						)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 404:
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(`Error 404 - The resource was not found`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 422:
				return {
					error: true,
					message: new EmbedBuilder()
						.setTitle(`Error 422 - A required parameter was invalid`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
		}
		const waitingMessage =
			interaction === true
				? ``
				: await MessageUtils.send(
						(message as Message).channel,
						`Loading the multiple Gfycat Posts from \`${user}\` ... ⌛🐱`,
				  );
		const channelObject = message.channel as TextChannel;

		let gfycatDataFiltered: gfycatSingleGfycatInterface[] = [];

		if (channelObject.nsfw !== true) {
			gfycatDataFiltered = (gfycatData.data as gfycatUserFeedInterface).gfycats.filter((gfy) => gfy.nsfw === 0);
		}

		if (!gfycatDataFiltered.length)
			return {
				error: true,
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`No results based on your specifications`),
			};

		const embeds = await this.generateGfyCatEmbed(gfycatDataFiltered);
		if (!embeds.length)
			return {
				error: true,
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`No results based on your specifications`),
			};
		interaction === true ? `` : (waitingMessage as Message).delete();
		return { error: false, embeds: embeds };
	}

	private async getGfycat(
		interaction: boolean,
		message: Message | CommandInteraction,
		gfyID: string,
	): Promise<IUserProfileCmd> {
		const blacklistGfyIdData = await prisma.gfycatBlacklist.count({
			where: {
				username: gfyID,
			},
		});
		if (blacklistGfyIdData > 0) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Error - couldn't find \`${gfyID}\``),
			};
		}
		interface IGfy {
			gfyItem: {
				username?: string;
				userData?: {
					profileImageUrl: string;
					verified: boolean;
					username: string;
					url: string;
				};
				gfyName: string;
				avgColor: HexColorString;
				description: string;
				views: number;
				likes: string;
				createDate: string;
				frameRate: number;
				width: string;
				height: string;
				tags: string[];
			};
		}
		const gfycatData = await gfycatAPI.get<IGfy | gfycatErrorMessage>(`gfycats/${gfyID}`, {
			headers: {
				Authorization: `Bearer ${gfycatToken}`,
				'Content-Type': `application/json`,
			},
		});
		switch (gfycatData.status) {
			case 400:
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error 400 - Required fields were invalid, or missing`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 401:
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error 401 - The access token is invalid or has been revoked`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 403:
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(
							`Error 403 - The clientId does not have permission, or the userId in the request path points to wrong/non-existent user`,
						)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 404:
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error 404 - The resource was not found`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
			case 422:
				return {
					error: true,
					embed: new EmbedBuilder()
						.setTitle(`Error 422 - A required parameter was invalid`)
						.setDescription(
							`**${(gfycatData.data as gfycatErrorMessage).code}**\n${
								(gfycatData.data as gfycatErrorMessage).description
							}`,
						)
						.setColor(botColours.error),
				};
		}
		const blacklistUserData = await prisma.gfycatBlacklist.count({
			where: {
				username: (gfycatData?.data as IGfy).gfyItem.username,
			},
		});
		if (blacklistUserData > 0) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Error - couldn't find the user \`${(gfycatData?.data as IGfy).gfyItem.username}\``),
			};
		}

		if (gfycatData === undefined) {
			return {
				error: true,
				embed: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Error - couldn't find \`${gfyID}\``),
			};
		} else {
			const gfycatEmbed = `https://gfycat.com/${(gfycatData?.data as IGfy).gfyItem.gfyName}`;
			const embed = new EmbedBuilder()
				.setColor(`${(gfycatData?.data as IGfy).gfyItem.avgColor}`)
				.setTitle((gfycatData?.data as IGfy).gfyItem.gfyName)
				.setDescription(
					`${
						(gfycatData?.data as IGfy).gfyItem.description.length > 0
							? `${(gfycatData?.data as IGfy).gfyItem.description}\n\n`
							: ``
					}Total Views: ${stylingUtils.nFormatter((gfycatData?.data as IGfy).gfyItem.views, 1)}\n${
						(gfycatData?.data as IGfy).gfyItem.likes
					} Likes ❤️ \nGfycat Post made on <t:${(gfycatData?.data as IGfy).gfyItem.createDate}:F>\nFrame rate: ${
						(gfycatData?.data as IGfy).gfyItem.frameRate
					}\nWidth & Height: ${(gfycatData?.data as IGfy).gfyItem.width}x${(gfycatData?.data as IGfy).gfyItem.height}${
						(gfycatData?.data as IGfy).gfyItem.tags.length > 0
							? `\n\nTags: ${(gfycatData?.data as IGfy).gfyItem.tags.join(`, `)}`
							: ``
					}`,
				);
			let userAuthorData: EmbedAuthorData;
			if ((gfycatData?.data as IGfy).gfyItem.username !== `anonymous`) {
				userAuthorData = {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					name: (gfycatData?.data as IGfy).gfyItem.userData!.verified
						? `${(gfycatData?.data as IGfy).gfyItem.username as string} ✔️`
						: ((gfycatData?.data as IGfy).gfyItem.username as string),
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					iconURL: (gfycatData?.data as IGfy).gfyItem.userData!.profileImageUrl,
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					url: (gfycatData?.data as IGfy).gfyItem.userData!.url,
				};
				embed.setAuthor(userAuthorData);
			}
			return { error: false, embed: embed, content: gfycatEmbed };
		}
	}

	private async generateGfyCatEmbed(gfycat: gfycatSingleGfycatInterface[]) {
		const embeds: string[] = [];
		for (let i = 0; i < gfycat.length; i += 1) {
			const current = gfycat[i];

			const embed = `${current.title.length > 0 ? `**${current.title}**\n` : ``}${
				current.userData?.username.length ? `Made by <${current.userData.url}>\n` : ``
			}${current.views} Views\n<t:${current.createDate}:F>\nhttps://gfycat.com/${current.gfyName}`;
			await axios
				.get(current.mobileUrl)
				.then(() => {
					embeds.push(embed);
				})
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				.catch(() => {});
		}
		return embeds;
	}
}
