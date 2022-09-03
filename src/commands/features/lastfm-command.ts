import {
	CommandInteraction,
	EmbedAuthorData,
	EmbedBuilder,
	EmbedFooterData,
	GuildMember,
	Message,
	PermissionsString,
} from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { prisma } from '../../services/prisma.js';
import { DateTime } from 'luxon';
import { botColours, stylingUtils } from '../../utils/styling-utils.js';
import * as dotenv from 'dotenv';
import axios from 'axios';
import {
	lastfmProfile,
	lastfmRecentTrackDate,
	lastfmRecentTracks,
	lastfmTopAlbum,
	lastfmTopAlbums,
	lastfmTopArtist,
	lastfmTopArtists,
	lastfmTopTrack,
	lastfmTopTracks,
} from '../../interfaces/lastfm.js';
dotenv.config();
import { flag } from 'country-emoji';
import SpotifyWebApi from 'spotify-web-api-node';
import { sushiiUtils } from '../../utils/sushii-utils.js';
import { lastfm } from '@prisma/client';

interface lastfmCollageResult {
	imageBuffer: Buffer;
	name: string;
}

const api_key = process.env.lastfm;

const lastfmAPI = axios.create({
	baseURL: `https://ws.audioscrobbler.com/2.0`,
	params: { api_key: api_key, format: `json` },
});

const spotifyCred = new SpotifyWebApi({
	clientId: process.env.spotifyClientID,
	clientSecret: process.env.spotifyClientSecret,
	redirectUri: `http://localhost:3000/auth/spotify/success`,
});

async function newToken() {
	await spotifyCred.clientCredentialsGrant().then(
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async function (data: any) {
			console.log(`The Spotify Access Token expires in ` + data.body[`expires_in`]);
			//console.log('The access token is ' + data.body['access_token']);

			// Save the access token so that it's used in future calls
			await spotifyCred.setAccessToken(data.body[`access_token`]);
		},
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		async function (err: any) {
			console.log(`Something went wrong when retrieving an access token`, err);
		},
	);
}

if (process.env.NODE_ENV === `production`) {
	newToken();
	setInterval(newToken, 3600000);
}

export class LastfmCommand implements Command {
	public name = `lastfm`;
	public aliases = [`fm`, `lf`];
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Lastfm`;
	public slashDescription = `Lastfm integration`;
	public commandType = CommandType.Both;
	public usage = `/lastfm`;
	public website = `https://www.bentobot.xyz/commands#lastfm`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `lastfm`,
		description: this.slashDescription,
		options: [
			{
				name: `set`,
				description: `Set or update lastfm username`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `username`,
						description: `Your lastfm username`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `remove`,
				description: `Remove your saved lastfm username`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
			},
			{
				name: `nowplaying`,
				description: `Check your two most recent songs`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `The Discord user you want to check`,
						type: ApplicationCommandOptionType.User.valueOf(),
					},
				],
			},
			{
				name: `profile`,
				description: `Check a user's lastfm account`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `The Discord user you want to check`,
						type: ApplicationCommandOptionType.User.valueOf(),
						required: true,
					},
				],
			},
			{
				name: `collage`,
				description: `Get a photo collage of your top music`,
				type: ApplicationCommandOptionType.Subcommand.valueOf(),
				options: [
					{
						name: `user`,
						description: `The Discord user you want to check`,
						type: ApplicationCommandOptionType.User.valueOf(),
						required: true,
					},
					{
						name: `type`,
						description: `Which top type`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
						choices: [
							{
								name: `Top Tracks`,
								value: `toptracks`,
							},
							{
								name: `Top Albums`,
								value: `topalbums`,
							},
							{
								name: `Top Artists`,
								value: `topartists`,
							},
						],
					},
					{
						name: `period`,
						description: `What time period`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
						choices: [
							{
								name: `Overall`,
								value: `overall`,
							},
							{
								name: `Week`,
								value: `week`,
							},
							{
								name: `Month`,
								value: `month`,
							},
							{
								name: `Year`,
								value: `year`,
							},
							{
								name: `3 Months`,
								value: `3month`,
							},
							{
								name: `Half year`,
								value: `6month`,
							},
						],
					},
					{
						name: `images`,
						description: `Amount of images`,
						type: ApplicationCommandOptionType.String.valueOf(),
						required: true,
						choices: [
							{
								name: `1x1`,
								value: `1x1`,
							},
							{
								name: `2x2`,
								value: `2x2`,
							},
							{
								name: `3x3`,
								value: `3x3`,
							},
							{
								name: `4x4`,
								value: `4x4`,
							},
							{
								name: `5x5`,
								value: `5x5`,
							},
							{
								name: `6x6`,
								value: `6x6`,
							},
						],
					},
				],
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		let cmd: EmbedBuilder | { error: boolean; result: EmbedBuilder | lastfmCollageResult } | string = ``;
		let collage = false;
		if (intr.options.data[0].name === `set`) {
			cmd = await this.setLastfmUser(intr, intr.options.get(`username`, true).value as string);
		}
		if (intr.options.data[0].name === `remove`) {
			cmd = await this.removeLastfmUser(intr);
		}
		if (intr.options.data[0].name === `nowplaying`) {
			cmd = await this.lastfmNowPlaying(intr, intr.options.get(`user`)?.member as GuildMember);
		}
		if (intr.options.data[0].name === `profile`) {
			cmd = await this.lastfmProfile(intr, intr.options.get(`user`, true).member as GuildMember);
		}
		if (intr.options.data[0].name === `collage`) {
			cmd = await this.lastfmCollage(
				intr,
				intr.options.get(`user`, true).member as GuildMember,
				intr.options.get(`type`, true).value as string,
				intr.options.get(`period`, true).value as string,
				intr.options.get(`images`, true).value as string,
			);
			collage = true;
		}
		if (collage) {
			if ((cmd as { error: boolean; result: EmbedBuilder | lastfmCollageResult }).error === true) {
				await InteractionUtils.send(
					intr,
					(cmd as { error: boolean; result: EmbedBuilder | lastfmCollageResult }).result as EmbedBuilder,
				);
			} else {
				await InteractionUtils.send(intr, {
					files: [
						{
							name: `${
								((cmd as { error: boolean; result: EmbedBuilder | lastfmCollageResult }).result as lastfmCollageResult)
									.name
							}.png`,
							attachment: (
								(cmd as { error: boolean; result: EmbedBuilder | lastfmCollageResult }).result as lastfmCollageResult
							).imageBuffer,
						},
					],
				});
			}
			return;
		} else {
			await InteractionUtils.send(intr, cmd as EmbedBuilder);
		}
		return;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>): Promise<void> {
		await MessageUtils.send(msg.channel, `Yay message commands works again.\nLastfm message command coming soon™️`);
		return;
	}

	private async setLastfmUser(intr: CommandInteraction, username: string): Promise<EmbedBuilder> {
		await prisma.lastfm.upsert({
			create: {
				userID: BigInt(intr.user.id),
				lastfm: username,
			},
			update: {
				lastfm: username,
			},
			where: {
				userID: BigInt(intr.user.id),
			},
		});
		return new EmbedBuilder().setTitle(`Your username was saved as ${username}`).setColor(botColours.success);
	}

	private async removeLastfmUser(intr: CommandInteraction): Promise<EmbedBuilder> {
		await prisma.lastfm.delete({
			where: {
				userID: BigInt(intr.user.id),
			},
		});
		return new EmbedBuilder().setTitle(`Your username was deleted`).setColor(botColours.success);
	}

	private async lastfmNowPlaying(intr: CommandInteraction, member: GuildMember | undefined): Promise<EmbedBuilder> {
		let lastfmUser: lastfm | null = null;
		if (member === undefined) {
			lastfmUser = await prisma.lastfm.findUnique({
				where: {
					userID: BigInt(intr.user.id),
				},
			});
			if (lastfmUser === null) {
				return new EmbedBuilder()
					.setTitle(`This user does not have lastfm set with Bento 🍱`)
					.setColor(botColours.error);
			}
		} else {
			lastfmUser = await prisma.lastfm.findUnique({
				where: {
					userID: BigInt(member.user.id),
				},
			});
			if (lastfmUser === null) {
				return new EmbedBuilder()
					.setTitle(`This user does not have lastfm set with Bento 🍱`)
					.setColor(botColours.error);
			}
		}
		const response = await lastfmAPI.get(`/`, {
			params: {
				method: `user.getrecenttracks`,
				user: lastfmUser.lastfm,
				limit: 2,
				page: 1,
			},
		});
		if (response.status !== 200) {
			return new EmbedBuilder().setTitle(`Lastfm error 😔`).setColor(botColours.error);
		} else {
			const usernameEmbed: lastfmRecentTracks = response.data;
			const userAuthorData: EmbedAuthorData = {
				// eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion
				name: member === undefined ? (await intr.guild?.members.fetch(intr.user))!.displayName : member.displayName,
				// eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion
				iconURL:
					member === undefined
						? // eslint-disable-next-line no-unsafe-optional-chaining, @typescript-eslint/no-non-null-assertion
						  (await intr.guild?.members.fetch(intr.user))!.displayAvatarURL({ forceStatic: false })
						: member.displayAvatarURL({ forceStatic: false }),
				url: `https://www.last.fm/user/${lastfmUser.lastfm}`,
			};
			const footerData: EmbedFooterData = {
				text: `Total Tracks: ${usernameEmbed.recenttracks[`@attr`].total} | Powered by last.fm`,
				iconURL: `https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png`,
			};
			const embed = new EmbedBuilder()
				.setAuthor(userAuthorData)
				.setColor(`#e4141e`)
				.setThumbnail(usernameEmbed.recenttracks.track[0].image[3][`#text`])
				.addFields(
					{
						name: `${
							usernameEmbed.recenttracks.track[0][`@attr`]?.nowplaying
								? `Now Playing`
								: stylingUtils.capitalizeFirstCharacter(
										`${DateTime.fromSeconds(
											parseInt((usernameEmbed.recenttracks.track[0].date as lastfmRecentTrackDate).uts),
										).toRelative()}`,
								  )
						}`,
						value: `**${usernameEmbed.recenttracks.track[0].artist[`#text`]}** - [${
							usernameEmbed.recenttracks.track[0].name
						}](${usernameEmbed.recenttracks.track[0].url})\nFrom the album **${
							usernameEmbed.recenttracks.track[0].album[`#text`]
						}**`,
					},
					{
						name: `${stylingUtils.capitalizeFirstCharacter(
							`${DateTime.fromSeconds(
								parseInt((usernameEmbed.recenttracks.track[1].date as lastfmRecentTrackDate).uts),
							).toRelative()}`,
						)}`,
						value: `**${usernameEmbed.recenttracks.track[1].artist[`#text`]}** - [${
							usernameEmbed.recenttracks.track[1].name
						}](${usernameEmbed.recenttracks.track[1].url})\nFrom the album **${
							usernameEmbed.recenttracks.track[1].album[`#text`]
						}**`,
					},
				)
				.setFooter(footerData);
			return embed;
		}
	}

	private async lastfmProfile(intr: CommandInteraction, member: GuildMember): Promise<EmbedBuilder> {
		const lastfmUser = await prisma.lastfm.findUnique({
			where: {
				userID: BigInt(member.user.id),
			},
		});
		if (lastfmUser === null) {
			return new EmbedBuilder().setTitle(`This user does not have lastfm set with Bento 🍱`).setColor(botColours.error);
		} else {
			const response = await lastfmAPI.get(`/`, {
				params: { method: `user.getinfo`, user: lastfmUser.lastfm },
			});
			if (response.status !== 200) {
				return new EmbedBuilder().setTitle(`Lastfm error 😔`).setColor(botColours.error);
			} else {
				const usernameEmbed: lastfmProfile = response.data;
				const userAuthorData: EmbedAuthorData = {
					name: member.displayName,
					iconURL: member.displayAvatarURL({ forceStatic: false }),
					url: `https://www.last.fm/user/${lastfmUser.lastfm}`,
				};
				const footerData: EmbedFooterData = {
					text: `Powered by last.fm`,
					iconURL: `https://www.last.fm/static/images/lastfm_avatar_twitter.52a5d69a85ac.png`,
				};
				const embed = new EmbedBuilder()
					.setAuthor(userAuthorData)
					.setColor(`#e4141e`)
					.setThumbnail(usernameEmbed.user.image[3][`#text`])
					.setURL(usernameEmbed.user.url)
					.setTitle(`last.fm Profile for ${usernameEmbed.user.name}`)
					.addFields(
						{
							name: `Country`,
							value: `${usernameEmbed.user.country} ${flag(usernameEmbed.user.country)}`,
						},
						{
							name: `Track Plays`,
							value: `${usernameEmbed.user.playcount}`,
						},
						{
							name: `Account Created`,
							value: `${DateTime.fromSeconds(parseInt(usernameEmbed.user.registered.unixtime)).toRelativeCalendar()}`,
						},
					)
					.setFooter(footerData);
				return embed;
			}
		}
	}

	private async lastfmCollage(
		intr: CommandInteraction,
		member: GuildMember,
		type: string,
		period: string,
		images: string,
	): Promise<{ error: boolean; result: lastfmCollageResult | EmbedBuilder }> {
		const lastfmUser = await prisma.lastfm.findUnique({
			where: {
				userID: BigInt(member.user.id),
			},
		});
		if (lastfmUser === null) {
			return {
				error: true,
				result: new EmbedBuilder()
					.setTitle(`This user does not have lastfm set with Bento 🍱`)
					.setColor(botColours.error),
			};
		} else {
			let topType = ``;
			if (type === `toptracks`) {
				topType = `track`;
			}
			if (type === `topalbums`) {
				topType = `album`;
			}
			if (type === `topartists`) {
				topType = `artist`;
			}
			const dims = images.split(`x`);
			let dimension = Math.round(Math.sqrt(+dims[0] * +dims[1])) || 3;
			if (dimension > 10) dimension = 10;
			const itemCount = dimension ** 2;
			const response = await lastfmAPI.get(`/`, {
				params: {
					method: `user.gettop${topType}s`,
					user: lastfmUser.lastfm,
					period: period,
					limit: itemCount,
					page: 1,
				},
			});
			if (response.status !== 200) {
				return { error: true, result: new EmbedBuilder().setTitle(`Lastfm error 😔`).setColor(botColours.error) };
			} else {
				let collection;
				let getCollection;
				if (topType === `track`) {
					getCollection = response.data as lastfmTopTracks;
					collection = getCollection.toptracks.track;
				}
				if (topType === `album`) {
					getCollection = response.data as lastfmTopAlbums;
					collection = getCollection.topalbums.album;
				}
				if (topType === `artist`) {
					getCollection = response.data as lastfmTopArtists;
					collection = getCollection.topartists.artist;
				}
				if (!collection) {
					return {
						error: true,
						result: new EmbedBuilder()
							.setTitle(`You haven't listened to any music during this period`)
							.setColor(botColours.error),
					};
				}
				while (Math.sqrt(collection.length) <= dimension - 1) dimension--;
				const screen_width = (collection.length < dimension ? collection.length : dimension) * 300;
				const screen_height = Math.ceil(collection.length / dimension) * 300;

				const css = `div {
                font-size: 0px;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }
            
            body {
                display: block;
                margin: 0px;
            }
            
            .grid {
                background-color: black;
            }
            
            .container {
                width: 300px;
                display: inline-block;
                position: relative;
            }
            
            .text {
                width: 296px;
                position: absolute;
                text-align: left;
                line-height: 1;
                
                font-family: 'Roboto Mono', 'Noto Sans CJK KR', 'Noto Sans CJK JP', 'Noto Sans CJK SC', 'Noto Sans CJK TC', monospace, sans-serif, serif;
                font-size: 16px;
                font-weight: medium;
                color: white;
                text-shadow: 
                    1px 1px black;
                
                top: 2px;
                 left: 2px;
                right:2px;
            }`;
				let htmlString = ``;

				htmlString += `<div class="grid">\n    `;
				for (let i = 0; i < dimension; i++) {
					htmlString += `<div class="row">\n    `;
					for (let i = 0; i < dimension; i++) {
						if (collection.length < 1) break;

						if (topType === `album`) {
							const item = collection.shift() as lastfmTopAlbum;
							const image = item.image[item.image.length - 1][`#text`];

							htmlString += [
								`    <div class="container">\n    `,
								`        <img src="${image}" width="${300}" height="${300}">\n    `,
								`        <div class="text">${item.artist.name}<br>${item.name}<br>Plays: ${item.playcount}</div>\n    `,
								`    </div>\n    `,
							].join(``);
						}
						if (topType === `track`) {
							const item = collection.shift() as lastfmTopTrack;
							let image: string | undefined;
							await spotifyCred.searchArtists(item.artist.name, { limit: 1 }).then(
								function (data) {
									if ((data.body.artists?.items.length as number) < 0) {
										image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									} else if (data.body.artists?.items[0].images[0]?.url === undefined) {
										image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									} else {
										image =
											data.body.artists.items[0].images.length < 0
												? (member.avatarURL({ extension: `png`, size: 512 }) as string)
												: data.body.artists.items[0].images[0].url;
									}
								},
								function (err) {
									image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									console.error(err);
								},
							);

							htmlString += [
								`    <div class="container">\n    `,
								`        <img src="${image}" width="${300}" height="${300}">\n    `,
								`        <div class="text">${item.artist.name}<br>${item.name}<br>Plays: ${item.playcount}</div>\n    `,
								`    </div>\n    `,
							].join(``);
						}
						if (topType === `artist`) {
							const item = collection.shift() as lastfmTopArtist;
							let image: string | undefined;
							await spotifyCred.searchArtists(item.name, { limit: 1 }).then(
								function (data) {
									if ((data.body.artists?.items.length as number) < 0) {
										image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									} else if (data.body.artists?.items[0].images[0]?.url === undefined) {
										image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									} else {
										image =
											data.body.artists.items[0].images.length < 0
												? (member.avatarURL({ extension: `png`, size: 512 }) as string)
												: data.body.artists.items[0].images[0].url;
									}
								},
								function (err) {
									image = member.avatarURL({ extension: `png`, size: 512 }) as string;
									console.error(err);
								},
							);
							htmlString += [
								`    <div class="container">\n    `,
								`        <img src="${image}" width="${300}" height="${300}">\n    `,
								`        <div class="text">${item.name}<br>Plays: ${item.playcount}</div>\n    `,
								`    </div>\n    `,
							].join(``);
						}
					}
					htmlString += `</div>\n`;
				}
				htmlString += `</div>`;

				htmlString = [
					`<html>\n`,
					`<head>\n`,
					`    <meta charset="UTF-8">\n`,
					`</head>\n\n`,
					`<style>\n`,
					`${css}\n`,
					`</style>\n\n`,
					`<body>\n`,
					`${htmlString}\n`,
					`</body>\n\n`,
					`</html>\n`,
				].join(``);
				const image = await sushiiUtils.getHTMLImage(htmlString, `${screen_width}`, `${screen_height}`);
				return {
					error: false,
					result: {
						imageBuffer: image,
						name: `${lastfmUser.lastfm}-${period}-${new Date(Date.now()).toISOString()}.png`,
					},
				};
			}
		}
	}
}
