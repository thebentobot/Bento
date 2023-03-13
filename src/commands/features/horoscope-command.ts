import {
	CommandInteraction,
	EmbedAuthorData,
	EmbedBuilder,
	GuildMember,
	HexColorString,
	Message,
	PermissionsString,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { ClientUtils, MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { botColours, stylingUtils } from '../../utils/styling-utils.js';
import { prisma } from '../../services/prisma.js';
import { horos } from '@prisma/client';
import chroma from 'chroma-js';
import axios from 'axios';
import { IHoroscopeDataAPI } from '../../interfaces/horoscope.js';

const astroAPI = axios.create({
	baseURL: `https://aztro.sameerkumar.website`,
});

const horoscopes = [
	`Aries`,
	`Taurus`,
	`Gemini`,
	`Cancer`,
	`Leo`,
	`Virgo`,
	`Libra`,
	`Scorpio`,
	`Sagittarius`,
	`Capricorn`,
	`Aquarius`,
	`Pisces`,
];

export class HoroscopeCommand implements Command {
	public name = `horoscope`;
	public aliases = [`horo`, `astro`, `zodiac`, `hs`];
	public requireDev = false;
	public requireGuild = true; //will be adjusted to dm's in the future (change some of the code that obtains user id's)
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Provides a horoscope based on day and sign. Either by writing/choosing a sign or saving it with the save command.`;
	public slashDescription = `Provides a horoscope based on day and sign.`;
	public commandType = CommandType.Both;
	public usage = `horoscope <save> <sign> to save sign. <prefix>horoscope remove to remove sign saved to your account. <prefix>horoscope <today/tomorrow/yesterday> [sign] | /horoscope`;
	public website = `https://www.bentobot.xyz/commands#horoscope`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `horoscope`,
		description: this.slashDescription,
		options: [
			{
				name: `today`,
				description: `Check a horoscope for today`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `sign`,
						description: `Sign to check horoscope for`,
						type: ApplicationCommandOptionType.String.valueOf(),
						choices: [
							{
								name: `Capricorn`,
								value: `Capricorn`,
							},
							{
								name: `Aquarius`,
								value: `Aquarius`,
							},
							{
								name: `Pisces`,
								value: `Pisces`,
							},
							{
								name: `Aries`,
								value: `Aries`,
							},
							{
								name: `Taurus`,
								value: `Taurus`,
							},
							{
								name: `Gemini`,
								value: `Gemini`,
							},
							{
								name: `Cancer`,
								value: `Cancer`,
							},
							{
								name: `Leo`,
								value: `Leo`,
							},
							{
								name: `Virgo`,
								value: `Virgo`,
							},
							{
								name: `Libra`,
								value: `Libra`,
							},
							{
								name: `Scorpio`,
								value: `Scorpio`,
							},
							{
								name: `Sagittarius`,
								value: `Sagittarius`,
							},
						],
					},
				],
			},
			{
				name: `tomorrow`,
				description: `Check a horoscope for tomorrow`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `sign`,
						description: `Sign to check horoscope for`,
						type: ApplicationCommandOptionType.String.valueOf(),
						choices: [
							{
								name: `Capricorn`,
								value: `Capricorn`,
							},
							{
								name: `Aquarius`,
								value: `Aquarius`,
							},
							{
								name: `Pisces`,
								value: `Pisces`,
							},
							{
								name: `Aries`,
								value: `Aries`,
							},
							{
								name: `Taurus`,
								value: `Taurus`,
							},
							{
								name: `Gemini`,
								value: `Gemini`,
							},
							{
								name: `Cancer`,
								value: `Cancer`,
							},
							{
								name: `Leo`,
								value: `Leo`,
							},
							{
								name: `Virgo`,
								value: `Virgo`,
							},
							{
								name: `Libra`,
								value: `Libra`,
							},
							{
								name: `Scorpio`,
								value: `Scorpio`,
							},
							{
								name: `Sagittarius`,
								value: `Sagittarius`,
							},
						],
					},
				],
			},
			{
				name: `yesterday`,
				description: `Check a horoscope for yesterday`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `sign`,
						description: `Sign to check horoscope for`,
						type: ApplicationCommandOptionType.String.valueOf(),
						choices: [
							{
								name: `Capricorn`,
								value: `Capricorn`,
							},
							{
								name: `Aquarius`,
								value: `Aquarius`,
							},
							{
								name: `Pisces`,
								value: `Pisces`,
							},
							{
								name: `Aries`,
								value: `Aries`,
							},
							{
								name: `Taurus`,
								value: `Taurus`,
							},
							{
								name: `Gemini`,
								value: `Gemini`,
							},
							{
								name: `Cancer`,
								value: `Cancer`,
							},
							{
								name: `Leo`,
								value: `Leo`,
							},
							{
								name: `Virgo`,
								value: `Virgo`,
							},
							{
								name: `Libra`,
								value: `Libra`,
							},
							{
								name: `Scorpio`,
								value: `Scorpio`,
							},
							{
								name: `Sagittarius`,
								value: `Sagittarius`,
							},
						],
					},
				],
			},
			{
				name: `save`,
				description: `Save a sign to check your horoscope for`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `sign`,
						description: `Sign to check horoscope for`,
						type: ApplicationCommandOptionType.String.valueOf(),
						choices: [
							{
								name: `Capricorn`,
								value: `Capricorn`,
							},
							{
								name: `Aquarius`,
								value: `Aquarius`,
							},
							{
								name: `Pisces`,
								value: `Pisces`,
							},
							{
								name: `Aries`,
								value: `Aries`,
							},
							{
								name: `Taurus`,
								value: `Taurus`,
							},
							{
								name: `Gemini`,
								value: `Gemini`,
							},
							{
								name: `Cancer`,
								value: `Cancer`,
							},
							{
								name: `Leo`,
								value: `Leo`,
							},
							{
								name: `Virgo`,
								value: `Virgo`,
							},
							{
								name: `Libra`,
								value: `Libra`,
							},
							{
								name: `Scorpio`,
								value: `Scorpio`,
							},
							{
								name: `Sagittarius`,
								value: `Sagittarius`,
							},
						],
					},
				],
			},
			{
				name: `remove`,
				description: `Remove a saved horoscope for you`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let command: EmbedBuilder | string = ``;
		if (intr.options.data[0].name === `save`) {
			command = await this.saveSign(true, intr, intr.options.get(`sign`)?.value as string);
		}
		if (intr.options.data[0].name === `remove`) {
			command = await this.removeSign(intr);
		}
		if (intr.options.data[0].name === `today`) {
			command = await this.horoscopeToday(intr, intr.options.get(`sign`)?.value as string);
		}
		if (intr.options.data[0].name === `tomorrow`) {
			command = await this.horoscopeTomorrow(intr, intr.options.get(`sign`)?.value as string);
		}
		if (intr.options.data[0].name === `yesterday`) {
			command = await this.horoscopeYesterday(intr, intr.options.get(`sign`)?.value as string);
		}
		await InteractionUtils.send(intr, command);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		let command: EmbedBuilder | string = ``;
		if (!args.length) {
			command = await this.horoscopeToday(msg, `saved`);
		} else {
			switch (args[0]) {
				case `save`:
					{
						command = await this.saveSign(false, msg, args[1]);
					}
					break;
				case `remove`:
					{
						command = await this.removeSign(msg);
					}
					break;
				case `today`:
					{
						command = await this.horoscopeToday(msg, args[1]);
					}
					break;
				case `tomorrow`:
					{
						command = await this.horoscopeTomorrow(msg, args[1]);
					}
					break;
				case `yesterday`:
					{
						command = await this.horoscopeYesterday(msg, args[1]);
					}
					break;
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

	public async saveSign(
		interaction: boolean,
		message: Message | CommandInteraction,
		input?: string,
	): Promise<EmbedBuilder> {
		if (!input) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`You haven't written a horoscope to save.`);
		}
		if (!horoscopes.includes(input)) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Invalid horoscope.\nPerhaps you've made a typo?`);
		}
		const data = await prisma.horoscope.upsert({
			create: {
				userID: interaction ? BigInt((message as CommandInteraction).user.id) : BigInt((message as Message).author.id),
				horoscope: input as horos,
			},
			update: {
				horoscope: input as horos,
			},
			where: {
				userID: interaction ? BigInt((message as CommandInteraction).user.id) : BigInt((message as Message).author.id),
			},
		});
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const member = await ClientUtils.findMember(
			message.guild!,
			interaction ? (message as CommandInteraction).user.id : (message as Message).author.id,
		);
		const embedAuthor: EmbedAuthorData = {
			name: (member as GuildMember).displayName,
			iconURL: (member as GuildMember).displayAvatarURL({ forceStatic: false }),
		};
		return new EmbedBuilder()
			.setAuthor(embedAuthor)
			.setTitle(`Your horoscope ${data.horoscope} was successfully saved!`)
			.setColor(botColours.success);
	}

	public async removeSign(message: Message | CommandInteraction): Promise<EmbedBuilder> {
		await prisma.horoscope.delete({
			where: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				userID: BigInt(message.member!.user.id),
			},
		});
		return new EmbedBuilder().setTitle(`Your horoscope was successfully deleted!`).setColor(botColours.success);
	}

	public async horoscopeToday(message: Message | CommandInteraction, input?: string): Promise<EmbedBuilder> {
		let horoscope: horos;
		let userSaved = false;
		if (!input) {
			const horoscopeData = await prisma.horoscope.findUnique({
				where: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					userID: BigInt(message.member!.user.id),
				},
			});
			if (!horoscopeData) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You haven't saved nor specified a sign to check the horoscope for today.`);
			} else {
				horoscope = horoscopeData.horoscope;
				userSaved = true;
			}
		} else if (!horoscopes.includes(input)) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Invalid horoscope.\nPerhaps you've made a typo?`);
		} else {
			horoscope = input as horos;
		}
		const horoscopeData = await astroAPI.post<IHoroscopeDataAPI>(`/?sign=${horoscope.toLowerCase()}&day=today`);
		if (horoscopeData.status !== 200) {
			return new EmbedBuilder().setTitle(`Error`).setColor(botColours.error).setDescription(`Horoscope API error.`);
		}
		const res = horoscopeData.data;
		const exampleEmbed = new EmbedBuilder()
			.setTitle(`${stylingUtils.capitalizeFirstCharacter(horoscope as string)} horoscope for ${res.current_date}`)
			.setDescription(res.description)
			.setTimestamp()
			.addFields(
				{
					name: `Date Range`,
					value: `Between ${res.date_range}`,
					inline: true,
				},
				{
					name: `Compatibility 😳`,
					value: `${res.compatibility} 😏`,
					inline: true,
				},
				{ name: `Mood`, value: `${res.mood}`, inline: true },
				{ name: `Colour`, value: `${res.color}`, inline: true },
				{
					name: `Lucky number`,
					value: `${res.lucky_number}`,
					inline: true,
				},
				{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
			);
		if (userSaved) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const member = await ClientUtils.findMember(message.guild!, message.member!.user.id);
			exampleEmbed.setAuthor({
				name: (member as GuildMember).displayName,
				iconURL: (member as GuildMember).displayAvatarURL({ forceStatic: false }),
			});
		}
		try {
			exampleEmbed.setColor(chroma(res.color).hex() as HexColorString);
		} catch {
			exampleEmbed.setColor(await stylingUtils.urlToColours(message.client.user?.avatarURL({ extension: `png` })));
		}
		return exampleEmbed;
	}

	public async horoscopeTomorrow(message: Message | CommandInteraction, input?: string) {
		let horoscope: horos;
		let userSaved = false;
		if (!input) {
			const horoscopeData = await prisma.horoscope.findUnique({
				where: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					userID: BigInt(message.member!.user.id),
				},
			});
			if (!horoscopeData) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You haven't saved nor specified a sign to check the horoscope for tomorrow.`);
			} else {
				horoscope = horoscopeData.horoscope;
				userSaved = true;
			}
		} else if (!horoscopes.includes(input)) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Invalid horoscope.\nPerhaps you've made a typo?`);
		} else {
			horoscope = input as horos;
		}
		const horoscopeData = await astroAPI.post<IHoroscopeDataAPI>(`/?sign=${horoscope.toLowerCase()}&day=tomorrow`);
		if (horoscopeData.status !== 200) {
			return new EmbedBuilder().setTitle(`Error`).setColor(botColours.error).setDescription(`Horoscope API error.`);
		}
		const res = horoscopeData.data;
		const exampleEmbed = new EmbedBuilder()
			.setTitle(`${stylingUtils.capitalizeFirstCharacter(horoscope as string)} horoscope for ${res.current_date}`)
			.setDescription(res.description)
			.setTimestamp()
			.addFields(
				{
					name: `Date Range`,
					value: `Between ${res.date_range}`,
					inline: true,
				},
				{
					name: `Compatibility 😳`,
					value: `${res.compatibility} 😏`,
					inline: true,
				},
				{ name: `Mood`, value: `${res.mood}`, inline: true },
				{ name: `Colour`, value: `${res.color}`, inline: true },
				{
					name: `Lucky number`,
					value: `${res.lucky_number}`,
					inline: true,
				},
				{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
			);
		if (userSaved) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const member = await ClientUtils.findMember(message.guild!, message.member!.user.id);
			exampleEmbed.setAuthor({
				name: (member as GuildMember).displayName,
				iconURL: (member as GuildMember).displayAvatarURL({ forceStatic: false }),
			});
		}
		try {
			exampleEmbed.setColor(chroma(res.color).hex() as HexColorString);
		} catch {
			exampleEmbed.setColor(await stylingUtils.urlToColours(message.client.user?.avatarURL({ extension: `png` })));
		}
		return exampleEmbed;
	}

	public async horoscopeYesterday(message: Message | CommandInteraction, input?: string) {
		let horoscope: horos;
		let userSaved = false;
		if (!input) {
			const horoscopeData = await prisma.horoscope.findUnique({
				where: {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					userID: BigInt(message.member!.user.id),
				},
			});
			if (!horoscopeData) {
				return new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`You haven't saved nor specified a sign to check the horoscope for yesterday.`);
			} else {
				horoscope = horoscopeData.horoscope;
				userSaved = true;
			}
		} else if (!horoscopes.includes(input)) {
			return new EmbedBuilder()
				.setTitle(`Error`)
				.setColor(botColours.error)
				.setDescription(`Invalid horoscope.\nPerhaps you've made a typo?`);
		} else {
			horoscope = input as horos;
		}
		const horoscopeData = await astroAPI.post<IHoroscopeDataAPI>(`/?sign=${horoscope.toLowerCase()}&day=yesterday`);
		if (horoscopeData.status !== 200) {
			return new EmbedBuilder().setTitle(`Error`).setColor(botColours.error).setDescription(`Horoscope API error.`);
		}
		const res = horoscopeData.data;
		const exampleEmbed = new EmbedBuilder()
			.setTitle(`${stylingUtils.capitalizeFirstCharacter(horoscope as string)} horoscope for ${res.current_date}`)
			.setDescription(res.description)
			.setTimestamp()
			.addFields(
				{
					name: `Date Range`,
					value: `Between ${res.date_range}`,
					inline: true,
				},
				{
					name: `Compatibility 😳`,
					value: `${res.compatibility} 😏`,
					inline: true,
				},
				{ name: `Mood`, value: `${res.mood}`, inline: true },
				{ name: `Colour`, value: `${res.color}`, inline: true },
				{
					name: `Lucky number`,
					value: `${res.lucky_number}`,
					inline: true,
				},
				{ name: `Lucky time`, value: `${res.lucky_time}`, inline: true },
			);
		if (userSaved) {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const member = await ClientUtils.findMember(message.guild!, message.member!.user.id);
			exampleEmbed.setAuthor({
				name: (member as GuildMember).displayName,
				iconURL: (member as GuildMember).displayAvatarURL({ forceStatic: false }),
			});
		}
		try {
			exampleEmbed.setColor(chroma(res.color).hex() as HexColorString);
		} catch {
			exampleEmbed.setColor(await stylingUtils.urlToColours(message.client.user?.avatarURL({ extension: `png` })));
		}
		return exampleEmbed;
	}
}
