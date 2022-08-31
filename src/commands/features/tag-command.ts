import {
	CommandInteraction,
	EmbedAuthorData,
	EmbedBuilder,
	escapeMarkdown,
	Guild,
	GuildMember,
	Message,
	PermissionsString,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { ClientUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import {
	APIInteractionDataResolvedGuildMember,
	ApplicationCommandOptionType,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';
import { botColours, stylingUtils } from '../../utils/styling-utils.js';
import { prisma } from '../../services/prisma.js';
import { commands } from '../../start.js';

// eslint-disable-next-line no-useless-escape
const regex = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
const tagArgs: string[] = [`add`, `delete`, `edit`, `info`, `list`, `random`, `rename`, `search`, `author`, `top`];

export class TagCommand implements Command {
	public name = `tag`;
	public requireDev = false;
	public requireGuild = true;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Create tags to save messages, photos or links by name. Add, delete, search, edit tags, get info about a tag or a list of all tags on a server`;
	public slashDescription = `Create tags to save messages, photos or links by name`;
	public commandType = CommandType.Both;
	public usage = `tag <add> <tag name> <tag content>\ntag <delete> <tag name>\ntag <edit> <tag name> <tag content being edit>\ntag <info> <tag name>\ntag <list>\ntag <random> [search query]\ntag <rename> <tag name> <new tag name>\ntag <search> <query>\ntag <author> [mention a user or userID]\ntag <top> | /tag`;
	public website = `https://www.bentobot.xyz/commands#tag`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `tag`,
		description: this.slashDescription,
		options: [
			{
				name: `get`,
				description: `Get a tag by name`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `add`,
				description: `Add a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						max_length: 20,
						required: true,
					},
					{
						name: `attachment`,
						description: `Attachment for the tag`,
						type: ApplicationCommandOptionType.Attachment.valueOf(),
					},
					{
						name: `text`,
						description: `Text content for the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
				],
			},
			{
				name: `delete`,
				description: `Delete a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `edit`,
				description: `Edit a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						max_length: 20,
						required: true,
					},
					{
						name: `attachment`,
						description: `Attachment for the tag`,
						type: ApplicationCommandOptionType.Attachment.valueOf(),
					},
					{
						name: `text`,
						description: `Text content for the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
				],
			},
			{
				name: `info`,
				description: `Get info about a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			/*
			TODO
			{
				name: `list`,
				description: `Get a list of tags on the server`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `top`,
						description: `Sort by the most used tags`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
					{
						name: `date`,
						description: `Sort by tag creation date`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
				],
			},
			*/
			{
				name: `random`,
				description: `Get a random tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `name`,
						description: `A random tag that includes this name`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
				],
			},
			{
				name: `rename`,
				description: `Rename the name of a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `old-name`,
						description: `Name of the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
					{
						name: `new-name`,
						description: `New name for the tag`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			/*
			TODO
			{
				name: `search`,
				description: `Search for a tag`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `query`,
						description: `What to search for tags by`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
					{
						name: `content`,
						description: `Search by content and not tag name`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
					{
						name: `top`,
						description: `Sort by the most used tags`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
					{
						name: `date`,
						description: `Sort by tag creation date`,
						type: ApplicationCommandOptionType.Boolean.valueOf(),
					},
				],
			},
			{
				name: `author`,
				description: `Get tags created by a user`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `Server user`,
						type: ApplicationCommandOptionType.User.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `top`,
				description: `Get the most used tags of the server`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
			*/
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let command: EmbedBuilder | string = ``;
		if (intr.options.data[0].name === `get`) {
			command = await this.getTag(true, intr, intr.options.get(`name`, true).value as string);
		}
		if (intr.options.data[0].name === `add`) {
			command = await this.addTag(
				true,
				intr,
				intr.options.get(`name`, true).value as string,
				intr.options.get(`text`)?.value as string,
				intr.options.get(`attachment`)?.attachment?.url,
			);
		}
		if (intr.options.data[0].name === `delete`) {
			command = await this.deleteTag(true, intr, intr.options.get(`name`, true).value as string);
		}
		if (intr.options.data[0].name === `edit`) {
			command = await this.editTag(
				true,
				intr,
				intr.options.get(`name`, true).value as string,
				intr.options.get(`text`)?.value as string,
				intr.options.get(`attachment`)?.attachment?.url,
			);
		}
		if (intr.options.data[0].name === `info`) {
			command = await this.getTagInfo(true, intr, intr.options.get(`name`, true).value as string);
		}
		/*
		TODO
		if (intr.options.data[0].name === `list`) {
			command = await this.getTagList(
				true,
				intr,
				[],
				intr.options.get(`top`)?.value as boolean,
				intr.options.get(`date`)?.value as boolean,
			);
		}
		*/
		if (intr.options.data[0].name === `random`) {
			command = await this.getRandomTag(true, intr, intr.options.get(`name`)?.value as string);
		}
		if (intr.options.data[0].name === `rename`) {
			command = await this.renameTag(
				true,
				intr,
				intr.options.get(`old-name`, true).value as string,
				intr.options.get(`new-name`, true).value as string,
			);
		}
		/*
		TODO
		if (intr.options.data[0].name === `search`) {
			command = await this.searchTags(
				true,
				intr,
				[],
				intr.options.get(`query`, true).value as string,
				intr.options.get(`content`)?.value as boolean,
				intr.options.get(`top`)?.value as boolean,
				intr.options.get(`date`)?.value as boolean,
			);
		}
		if (intr.options.data[0].name === `author`) {
			command = await this.getTagsByAuthor(true, intr, intr.options.get(`user`, true).member);
		}
		if (intr.options.data[0].name === `top`) {
			command = await this.getTopTags(true, intr);
		}
		*/
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		let command: EmbedBuilder | string = ``;
		if (!args.length) {
			command = new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Invalid argument. Use the help command to get help regarding this command.`);
		} else {
			switch (args[0]) {
				case `get`:
					{
						command = await this.getTag(false, msg, args[1]);
					}
					break;
				case `add`:
					{
						command = await this.addTag(false, msg, args[1], args.slice(2).join(` `));
					}
					break;
				case `delete`:
					{
						command = await this.deleteTag(false, msg, args[1]);
					}
					break;
				case `edit`:
					{
						command = await this.editTag(false, msg, args[1], args.slice(2).join(` `));
					}
					break;
				case `info`:
					{
						command = await this.getTagInfo(false, msg, args[1]);
					}
					break;
				/*
					TODO
				case `list`:
					{
						command = await this.getTagList(false, msg, args);
					}
					break;
					*/
				case `rename`:
					{
						command = await this.renameTag(false, msg, args[1], args[2]);
					}
					break;
				/*
				TODO
				case `search`:
					{
						command = await this.searchTags(false, msg, args);
					}
					break;
				case `author`:
					{
						const userId = msg.mentions.members?.first()?.id || args[1];
						const getUser = await ClientUtils.findMember(msg.guild as Guild, userId);
						if (!getUser) {
							command = new EmbedBuilder()
								.setTitle(`Error`)
								.setColor(botColours.error)
								.setDescription(`Invalid user. Did you post an invalid user id?`);
						} else {
							command = await this.getTagsByAuthor(false, msg, getUser);
						}
					}
					break;
				case `top`:
					{
						command = await this.getTopTags(false, msg);
					}
					break;
					*/
				default:
					{
						command = new EmbedBuilder()
							.setTitle(`Error`)
							.setColor(botColours.error)
							.setDescription(`Invalid argument. Use the help command to get help regarding this command.`);
					}
					break;
			}
		}
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async getTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
	): Promise<EmbedBuilder | string> {
		if (regex.test(tagName) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${tagName}\``);
		const customCommand = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tagName,
			},
		});
		if (customCommand) {
			return customCommand.content;
		} else {
			return new EmbedBuilder().setTitle(`Error`).setColor(botColours.error).setDescription(`This tag does not exist.`);
		}
	}

	private async addTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
		content?: string,
		attachment?: string,
	): Promise<EmbedBuilder | string> {
		const tag = tagName.toLowerCase();
		const commandNames = commands.map((cmd) => cmd.name);
		const aliasNames: string[] = [];
		commands
			.filter((cmd) => cmd.aliases !== undefined)
			.forEach((cmd) => cmd.aliases?.forEach((name) => aliasNames.push(name)));
		if (!tagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (regex.test(tag) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${tag}\``);
		if (tagArgs.includes(tag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag one of the tag arguments. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);
		if (aliasNames.includes(tag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag the same as one of the command aliases. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);
		if (commandNames.includes(tag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag the same as one of the command names. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);

		let files: string | undefined;
		let text: string | undefined;
		let tagContent: string | undefined;

		if (interaction) {
			files = attachment;
		} else {
			// eslint-disable-next-line no-lonely-if
			if ((message as Message).attachments.values() !== undefined) {
				const getUrl = [...(message as Message).attachments.values()];
				files = getUrl[0] ? getUrl.join(`, `) : ``;
			}
		}

		if (content) {
			text = content;
		}

		if (files && text) {
			tagContent = `${escapeMarkdown(text)}\n${files}`;
		} else if (text && !files) {
			tagContent = escapeMarkdown(text);
		} else if (!text && files) {
			tagContent = files;
		} else if (!text && !files) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You didn't attach any content for the tag \`${tag}\``);
		}

		if ((tagContent?.length as number) > 2000) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Your tag content is too long for me to be able to send it, sorry 😔`);
		}

		const tagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tag,
			},
		});

		if (tagExists !== null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${tag}\` already exists on this server.`);
		}

		const tagData = await prisma.tag.create({
			data: {
				userID: BigInt(message.member?.user.id as string),
				guildID: BigInt(message.guildId as string),
				command: tag,
				content: tagContent as string,
				count: 0,
			},
		});

		return `The tag \`${tagData.command}\` was was successfully saved!\nContent:\n${tagData.content}`;
	}

	private async deleteTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
	): Promise<EmbedBuilder> {
		const tag = tagName.toLowerCase();
		if (!tagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (regex.test(tag) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${tag}\``);
		const tagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tag,
			},
		});
		if (tagExists === null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${tag}\` doesn't exist on this server.`);
		} else {
			// eslint-disable-next-line no-lonely-if
			if ((message.member?.user.id as string) !== `${tagExists.userID}`) {
				if ((message as Message).member?.permissions.has(`ManageMessages`) === false) {
					return new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(
							`You do not have permission to delete this tag.\nYou either have to be the creator or have permission to delete messages on this server.`,
						);
				} else {
					await prisma.tag.delete({
						where: {
							tagID: tagExists.tagID,
						},
					});
					return new EmbedBuilder().setTitle(`You successfully deleted the tag ${tag}`).setColor(botColours.success);
				}
			} else {
				await prisma.tag.delete({
					where: {
						tagID: tagExists.tagID,
					},
				});
				return new EmbedBuilder().setTitle(`You successfully deleted the tag ${tag}`).setColor(botColours.success);
			}
		}
	}

	private async editTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
		content?: string,
		attachment?: string,
	): Promise<EmbedBuilder | string> {
		const tag = tagName.toLowerCase();
		if (!tagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (regex.test(tag) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${tag}\``);

		let files: string | undefined;
		let text: string | undefined;
		let tagContent: string | undefined;

		if (interaction) {
			files = attachment;
		} else {
			// eslint-disable-next-line no-lonely-if
			if ((message as Message).attachments.values() !== undefined) {
				const getUrl = [...(message as Message).attachments.values()];
				files = getUrl[0] ? getUrl.join(`, `) : ``;
			}
		}

		if (content) {
			text = content;
		}

		if (files && text) {
			tagContent = `${escapeMarkdown(text)}\n${files}`;
		} else if (text && !files) {
			tagContent = escapeMarkdown(text);
		} else if (!text && files) {
			tagContent = files;
		} else if (!text && !files) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You didn't attach any content for the tag \`${tag}\``);
		}

		if ((tagContent?.length as number) > 2000) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Your tag content is too long for me to be able to send it, sorry 😔`);
		}

		const tagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tag,
			},
		});

		if (tagExists === null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${tag}\` doesn't exist on this server.`);
		}

		if ((message.member?.user.id as string) !== `${tagExists.userID}`) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You do not have permission to edit this tag.\nOnly the author are allowed to edit this tag.`);
		} else {
			const tagData = await prisma.tag.update({
				where: {
					tagID: tagExists.tagID,
				},
				data: {
					content: tagContent as string,
				},
			});

			return `The tag \`${tagData.command}\` was successfully updated!\nContent:\n${tagData.content}`;
		}
	}

	private async getTagInfo(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
	): Promise<EmbedBuilder> {
		const tag = tagName.toLowerCase();
		if (!tagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (regex.test(tag) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${tag}\``);
		const tagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tag,
			},
		});
		if (tagExists === null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${tag}\` doesn't exist on this server.`);
		} else {
			const tagAuthorMember = await ClientUtils.findMember(message.guild as Guild, `${tagExists.userID}`);
			const embedAuthor: EmbedAuthorData = {
				name: (tagAuthorMember as GuildMember).displayName,
				iconURL: (tagAuthorMember as GuildMember).displayAvatarURL({ forceStatic: false }),
			};
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const timestamp = tagExists.date!.getTime();
			return new EmbedBuilder()
				.setAuthor(embedAuthor)
				.setTitle(stylingUtils.capitalizeFirstCharacter(tagExists.command))
				.setColor(botColours.bento)
				.setDescription(
					`**Date created** - <t:${Math.round(timestamp / 1000)}:F>\n**Usage counts** - ${tagExists.count}`,
				);
		}
	}
	/*
	TODO
	private async getTagList(
		interaction: boolean,
		message: Message | CommandInteraction,
		args: string[],
		top?: boolean,
		date?: boolean,
	): Promise<EmbedBuilder> {
		const catData = await axios.get(`http://aws.random.cat/meow`);
		return catData.data.file;
	}
	*/

	private async getRandomTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName?: string,
	): Promise<EmbedBuilder | string> {
		if (tagName) {
			const tag = tagName.toLowerCase();
			if (regex.test(tagName) === true)
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You can't add special characters to your tag name \`${tag}\``);
			const customCommand = await prisma.tag.findMany({
				where: {
					guildID: BigInt(message.guildId as string),
					command: {
						contains: tag,
					},
				},
			});
			if (!customCommand.length) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`A tag containing \`${tag}\` doesn't exist on this server.`);
			} else {
				return customCommand[Math.floor(Math.random() * customCommand.length)].content;
			}
		} else {
			const customCommand = await prisma.tag.findMany({
				where: {
					guildID: BigInt(message.guildId as string),
				},
			});
			if (!customCommand.length) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`There are no tags on this server.`);
			} else {
				return customCommand[Math.floor(Math.random() * customCommand.length)].content;
			}
		}
	}

	private async renameTag(
		interaction: boolean,
		message: Message | CommandInteraction,
		tagName: string,
		newTagName: string,
	): Promise<EmbedBuilder | string> {
		const tag = tagName.toLowerCase();
		const newTag = newTagName.toLowerCase();
		const commandNames = commands.map((cmd) => cmd.name);
		const aliasNames: string[] = [];
		commands
			.filter((cmd) => cmd.aliases !== undefined)
			.forEach((cmd) => cmd.aliases?.forEach((name) => aliasNames.push(name)));
		if (!tagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (!newTagName)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You need to set a name for the tag`);
		if (regex.test(newTag) === true)
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You can't add special characters to your tag name \`${newTag}\``);
		if (tagArgs.includes(newTag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag one of the tag arguments. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);
		if (aliasNames.includes(newTag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag the same as one of the command aliases. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);
		if (commandNames.includes(newTag))
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You can't name your tag the same as one of the command names. I am sorry.\nIf message commands gets removed, it won't be a restriction anymore.`,
				);

		const checkIfTagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: newTag,
			},
		});

		const tagExists = await prisma.tag.findFirst({
			where: {
				guildID: BigInt(message.guildId as string),
				command: tag,
			},
		});

		if (tagExists === null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${newTag}\` doesn't exist on this server.`);
		}

		if (checkIfTagExists !== null) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`A tag called \`${newTag}\` already exists on this server.`);
		}

		if ((message.member?.user.id as string) !== `${tagExists.userID}`) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(
					`You do not have permission to edit the name of this tag.\nOnly the author are allowed to edit this tag.`,
				);
		} else {
			const tagData = await prisma.tag.update({
				where: {
					tagID: tagExists.tagID,
				},
				data: {
					command: newTag as string,
				},
			});

			return `The tag name **${tag}** was successfully updated to \`${tagData.command}\`!`;
		}
	}
	/*
	TODO
	private async searchTags(
		interaction: boolean,
		message: Message | CommandInteraction,
		args: string[],
		query?: string,
		content?: boolean,
		top?: boolean,
		date?: boolean,
	): Promise<EmbedBuilder> {
		const catData = await axios.get(`http://aws.random.cat/meow`);
		return catData.data.file;
	}

	private async getTagsByAuthor(
		interaction: boolean,
		message: Message | CommandInteraction,
		author: GuildMember | APIInteractionDataResolvedGuildMember | null | undefined,
	): Promise<EmbedBuilder> {
		const catData = await axios.get(`http://aws.random.cat/meow`);
		return catData.data.file;
	}

	private async getTopTags(interaction: boolean, message: Message | CommandInteraction): Promise<EmbedBuilder> {
		const catData = await axios.get(`http://aws.random.cat/meow`);
		return catData.data.file;
	}
	*/
}
