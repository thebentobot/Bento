import {
	CommandInteraction,
	EmbedAuthorData,
	EmbedFooterData,
	Message,
	EmbedBuilder,
	PermissionsString,
	User,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { prisma } from '../../services/prisma.js';
import { IWeatherAPIObjectInterface } from '../../interfaces/weather.js';
import { botColours, stylingUtils } from '../../utils/styling-utils.js';
import { DateTime } from 'luxon';
import tzlookup from 'tz-lookup';
import { flag, name } from 'country-emoji';

export const openWeatherAPI = axios.create({
	baseURL: `https://api.openweathermap.org/data/2.5`,
});

export class WeatherCommand implements Command {
	public name = `weather`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Displays info about the weather at the city saved for the user, or at the specified city.\nIf it shows a city from another country than the one you expected, try to add a country code (e.g. US, GB, DE) beside the city (remember a comma after city), as shown below\nIf it does not show up either, it may not be included in the OpenWeather API.`;
	public slashDescription = `Check the weather at a city`;
	public commandType = CommandType.Both;
	public usage = `weather [city/save/remove] [<city>] | /weather`;
	public website = `https://www.bentobot.xyz/commands#weather`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `weather`,
		description: this.slashDescription,
		options: [
			{
				name: `city`,
				description: `Show the weather for a city. If no input, it will show your saved city`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `input`,
						description: `Write the city you want to check`,
						type: ApplicationCommandOptionType.String.valueOf(),
					},
				],
			},
			{
				name: `save`,
				description: `Save the city to show for you by default`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `city`,
						description: `Write the city you want to save`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `remove`,
				description: `Remove the city that are saved for you`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let cmd: EmbedBuilder;
		if (intr.options.data[0].name === `city`) {
			cmd = await this.cityOption(intr.options.get(`input`)?.value as string | undefined, intr.user);
		} else if (intr.options.data[0].name === `save`) {
			cmd = await this.saveOption(intr.options.get(`city`, true).value as string, intr.user);
		} else if (intr.options.data[0].name === `remove`) {
			cmd = await this.removeOption(intr.user);
		} else {
			cmd = await this.defaultOption(intr.user);
		}
		await InteractionUtils.send(intr, cmd);
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		let cmd: EmbedBuilder;
		if (!args.length) {
			cmd = await this.defaultOption(msg.author);
			await MessageUtils.send(msg.channel, cmd);
			return;
		} else {
			switch (args[0]) {
				case `city`:
					{
						cmd = await this.cityOption(args.slice(1).join(` `), msg.author);
					}
					break;
				case `save`:
					{
						cmd = await this.saveOption(args.slice(1).join(` `), msg.author);
					}
					break;
				case `remove`:
					{
						cmd = await this.removeOption(msg.author);
					}
					break;
				default:
					{
						cmd = await this.defaultOption(msg.author);
					}
					break;
			}
			await MessageUtils.send(msg.channel, cmd);
			return;
		}
	}

	private async weatherCommand(city: string, userWeather: boolean, user: User): Promise<EmbedBuilder> {
		const openWeatherFetch = await openWeatherAPI.get<IWeatherAPIObjectInterface>(`/weather?`, {
			params: {
				q: city,
				units: `metric`,
				appid: process.env.WEATHERKEY,
				lang: `en`,
			},
		});
		switch (openWeatherFetch.status) {
			case 401:
				return new EmbedBuilder()
					.setDescription(`The API key is invalid 🤔`)
					.setTitle(`Error`)
					.setColor(botColours.error);
			case 404:
				return new EmbedBuilder()
					.setDescription(`Your city input is invalid`)
					.setTitle(`Error`)
					.setColor(botColours.openWeatherAPI);
			case 429:
				return new EmbedBuilder()
					.setDescription(
						`${config.botName} has received more than 60 weather API calls the last minute, please wait 🙏🏻`,
					)
					.setTitle(`Error`)
					.setColor(botColours.openWeatherAPI);
			case 500:
			case 502:
			case 503:
			case 504:
				return new EmbedBuilder()
					.setDescription(`There's something wrong with OpenWeatherAPI, sorry 😔`)
					.setTitle(`Error`)
					.setColor(botColours.openWeatherAPI);
		}
		if (openWeatherFetch.status === 200) {
			const response = openWeatherFetch.data;
			const userAuthorData: EmbedAuthorData = {
				name: userWeather ? user.tag : `OpenWeather`,
				iconURL: userWeather
					? user.displayAvatarURL({ forceStatic: false })
					: `https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg`,
			};
			const footerData: EmbedFooterData = {
				text: `Last updated at ${this.toTimeZone(
					DateTime.fromSeconds(response.dt),
					this.location(response.coord.lat, response.coord.lon),
				)} local time`,
				iconURL: userWeather
					? `https://pbs.twimg.com/profile_images/1173919481082580992/f95OeyEW_400x400.jpg`
					: undefined,
			};
			const embed = new EmbedBuilder()
				.setColor(botColours.openWeatherAPI)
				.setAuthor(userAuthorData)
				.setTitle(
					`${stylingUtils.capitalizeFirstCharacter(response.weather[0].description)} ${this.weatherEmote(
						response.weather[0].id,
					)} in ${response.name}, ${name(response.sys.country)} ${flag(response.sys.country)}`,
				)
				.setURL(`https://openweathermap.org/city/${response.id}`)
				.setThumbnail(`http://openweathermap.org/img/w/${response.weather[0].icon}.png`)
				.setFooter(footerData)
				.setDescription(
					`🌡 ${Math.round(response.main.temp)}°C (${Math.round(
						(response.main.temp * 9) / 5 + 32,
					)}°F), feels like ${Math.round(response.main.feels_like)}°C (${Math.round(
						(response.main.feels_like * 9) / 5 + 32,
					)}°F)\n⚖️ Min. ${Math.round(response.main.temp_min)}°C (${Math.round(
						(response.main.temp_min * 9) / 5 + 32,
					)}°F), Max. ${Math.round(response.main.temp_max)}°C (${Math.round(
						(response.main.temp_max * 9) / 5 + 32,
					)}°F)\n☁️ ${response.clouds.all}% Cloudiness 💦 ${response.main.humidity}% Humidity\n💨 ${
						response.wind.speed
					} m/s ${this.windDirection(response.wind.deg)}\n\n🕒 ${this.localTime(response.timezone)} ${flag(
						response.sys.country,
					)}\n🌅 ${this.toTimeZone(
						DateTime.fromSeconds(response.sys.sunrise),
						this.location(response.coord.lat, response.coord.lon),
					)}\n🌇 ${this.toTimeZone(
						DateTime.fromSeconds(response.sys.sunset),
						this.location(response.coord.lat, response.coord.lon),
					)}`,
				)
				.setTimestamp();
			return embed;
		} else {
			return new EmbedBuilder()
				.setDescription(`There's something wrong with OpenWeatherAPI, sorry 😔`)
				.setTitle(`Error`)
				.setColor(botColours.openWeatherAPI);
		}
	}

	private async cityOption(input: string | undefined, intrUser: User): Promise<EmbedBuilder> {
		if (input === undefined) {
			const getIntrUserWeatherData = await prisma.weather.findUnique({
				where: {
					userID: BigInt(intrUser.id),
				},
			});
			if (getIntrUserWeatherData === null) {
				return new EmbedBuilder()
					.setDescription(`You haven't specified a city, user nor saved a city to show.`)
					.setTitle(`Error`)
					.setColor(botColours.openWeatherAPI);
			} else {
				const weatherEmbed = await this.weatherCommand(getIntrUserWeatherData.city, true, intrUser);
				return weatherEmbed;
			}
		} else {
			const weatherEmbed = await this.weatherCommand(input, false, intrUser);
			return weatherEmbed;
		}
	}

	private async saveOption(input: string, user: User): Promise<EmbedBuilder> {
		const saveWeatherUser = await prisma.weather.upsert({
			create: {
				city: input,
				userID: BigInt(user.id),
			},
			update: {
				city: input,
				userID: BigInt(user.id),
			},
			where: {
				userID: BigInt(user.id),
			},
		});
		return new EmbedBuilder()
			.setTitle(`Your weather city was saved!`)
			.setDescription(
				`**${stylingUtils.capitalizeFirstCharacter(
					saveWeatherUser.city,
				)}** was saved.\nYou can now use the weather command without any input, if you want to instantly check the weather at your saved location 😎`,
			)
			.setColor(botColours.openWeatherAPI);
	}

	private async removeOption(user: User): Promise<EmbedBuilder> {
		await prisma.weather.delete({
			where: {
				userID: BigInt(user.id),
			},
		});
		return new EmbedBuilder().setTitle(`Your weather city was deleted!`).setColor(botColours.openWeatherAPI);
	}

	private async defaultOption(user: User): Promise<EmbedBuilder> {
		const getIntrUserWeatherData = await prisma.weather.findUnique({
			where: {
				userID: BigInt(user.id),
			},
		});
		if (getIntrUserWeatherData === null) {
			return new EmbedBuilder()
				.setDescription(`You haven't specified a city, user nor saved a city to show.`)
				.setTitle(`Error`)
				.setColor(`#EB6E4B`);
		} else {
			const weatherEmbed = await this.weatherCommand(getIntrUserWeatherData.city, true, user);
			return weatherEmbed;
		}
	}

	private windDirection(degree: number) {
		if (degree === 90) {
			return `⬆️`;
		} else if (degree === 270) {
			return `⬇️`;
		} else if (degree === 180) {
			return `⬅️`;
		} else if (degree === 360 || 0) {
			return `➡️`;
		} else if (degree > 0 && degree < 90) {
			return `↗️`;
		} else if (degree > 270 && degree < 360) {
			return `↘️`;
		} else if (degree > 180 && degree < 270) {
			return `↙️`;
		} else if (degree > 90 && degree < 180) {
			return `↖️`;
		}
	}

	private weatherEmote(weather: number) {
		if (weather >= 210 && weather <= 221) {
			return `⛈️`;
		} else if (weather >= 200 && weather <= 202) {
			return `🌩️`;
		} else if (weather >= 230 && weather <= 232) {
			return `⛈️`;
		} else if (weather >= 300 && weather <= 321) {
			return `🌧️`;
		} else if (weather >= 500 && weather <= 504) {
			return `🌦️`;
		} else if (weather === 511) {
			return `🌨️`;
		} else if (weather >= 520 && weather <= 531) {
			return `🌧️`;
		} else if (weather >= 600 && weather <= 622) {
			return `❄️`;
		} else if (weather >= 701 && weather <= 781) {
			return `🌫️`;
		} else if (weather === 800) {
			return `☀️`;
		} else if (weather === 801) {
			return `⛅`;
		} else if (weather >= 802 && weather <= 804) {
			return `☁️`;
		}
	}

	private location(x: number, y: number) {
		const loc = tzlookup(x, y);
		return loc;
	}

	private toTimeZone(time: DateTime, zone: string) {
		return time.setZone(zone).toFormat(`t`);
	}

	private localTime(x: number) {
		const d = new Date();
		const localTimeVar = d.getTime();
		const localOffset = d.getTimezoneOffset() * 60000;
		const utc = localTimeVar + localOffset;
		const time = utc + 1000 * x;
		const nd = new Date(time);
		const ex = DateTime.fromJSDate(nd).toFormat(`t, DDDD`);
		return ex;
	}
}
