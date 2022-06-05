import {
	ChatInputApplicationCommandData,
	CommandInteraction,
	EmbedAuthorData,
	Message,
	MessageEmbed,
	PermissionString,
} from 'discord.js';
import { ApplicationCommandOptionType } from 'discord-api-types/v9';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils, stylingUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import axios from 'axios';

export class UrbanCommand implements Command {
	public name = `urban`;
	public slashDescription = `Search for definitions on Urban Dictionary`;
	public commandType = CommandType.Both;
	public metadata: ChatInputApplicationCommandData = {
		name: `urban`,
		description: this.slashDescription,
		options: [
			{
				name: `definition`,
				description: `The definition on Urban Dictionary`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true
			}
		]
	};
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionString[] = [];
	public requireUserPerms: PermissionString[] = [];
	public description = `Search for definitions on Urban Dictionary.\nIf the query you want to be defined doesn't exist, it won't return anything.`;
	public usage = `urban <search input> | /urban <search input>`;
	public website = `https://www.bentobot.xyz/commands#urban`;
	public category = `features`;

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		const query = intr.options.get(`definition`)?.value as string;
		const command = await this.urbanCommand(query);
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		if (!args.length) {
			MessageUtils.send(msg.channel, `You need to search for a definition!`);
			return;
		}
		const query: string = args.join(` `);
		const command = await this.urbanCommand(query);
		await MessageUtils.send(msg.channel, command);
		return;
	}

	private async urbanCommand(content: string): Promise<MessageEmbed | string> {
		const response = await axios.get(`https://api.urbandictionary.com/v0/define?`, { params: { term: content } });
		
		if (!response.data.list.length) {
			return `No definition found for \`${content}\`.` as string;
		}

        interface urbanDicInterface {
            word: string
            permalink: string
            definition: string
            example: string
            thumbs_up: number
            thumbs_down: number
        }

        const answer: urbanDicInterface = response.data.list[0];

        const authorData: EmbedAuthorData = {
        	name: `Urban Dictionary`,
        	iconURL: `https://is4-ssl.mzstatic.com/image/thumb/Purple111/v4/81/c8/5a/81c85a6c-9f9d-c895-7361-0b19b3e5422e/mzl.gpzumtgx.png/246x0w.png`,
        	url: `https://www.urbandictionary.com/`
        };

        const exampleEmbed = new MessageEmbed()
        	.setColor(`#1c9fea`)
        	.setAuthor(authorData)
        	.setTitle(answer.word)
        	.setURL(answer.permalink)
        	.setTimestamp()
        	.addFields(
        		{ name: `Definition`, value: stylingUtils.trim(answer.definition, 1024) },
        		{ name: `Example`, value: stylingUtils.trim(answer.example, 1024) },
        		{
        			name: `Rating`,
        			value: `${answer.thumbs_up} :thumbsup: ${answer.thumbs_down} :thumbsdown:`,
        		},
        	);

        return exampleEmbed;
	}
}