import { CommandInteraction, Message, EmbedBuilder, PermissionsString } from 'discord.js';
import { EventData } from '../../models/internal-models.js';
import { MessageUtils } from '../../utils/index.js';
import { Command, CommandDeferAccessType, CommandType } from '../command.js';
import { InteractionUtils } from '../../utils/interaction-utils.js';
import { config } from '../../config/config.js';
import { ApplicationCommandOptionType, RESTPostAPIChatInputApplicationCommandsJSONBody } from 'discord-api-types/v10';
import { botColours } from '../../utils/styling-utils.js';
import { sushiiUtils } from '../../utils/sushii-utils.js';

export class ColourCommand implements Command {
	public name = `colour`;
	public requireDev = false;
	public requireGuild = false;
	public requirePremium = false;
	public deferType = CommandDeferAccessType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];
	public requireUserPerms: PermissionsString[] = [];
	public description = `Make ${config.botName} send a picture of the hexcode/RGB colour you sent 🌈`;
	public slashDescription = `Make ${config.botName} send a picture of the colour you sent`;
	public commandType = CommandType.Both;
	public aliases?: string[] | undefined = [`color`];
	public usage = `colour <hexcode/RGB colour> | /colour`;
	public website = `https://www.bentobot.xyz/commands#colour`;
	public category = `features`;
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		name: `colour`,
		description: this.slashDescription,
		options: [
			{
				name: `input`,
				description: `Hexcode e.g. "${botColours.error}" or RGB e.g. "255, 0, 0"`,
				type: ApplicationCommandOptionType.String.valueOf(),
				required: true,
			},
		],
	};

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeIntr(intr: CommandInteraction, _data: EventData): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		const command = await this.colourCommand((intr.options.get(`input`, true).value! as string).trim());
		if (typeof command.image === `undefined`) {
			await InteractionUtils.send(intr, command.message);
			return;
		} else {
			await InteractionUtils.send(intr, {
				embeds: [command.message],
				files: [{ name: `${command.fileName}.png`, attachment: command.image }],
			});
			return;
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	public async executeMsgCmd(msg: Message<boolean>, args: string[]): Promise<void> {
		const command = await this.colourCommand(args.join(` `).trim());
		if (typeof command.image === `undefined`) {
			await MessageUtils.send(msg.channel, command.message);
			return;
		} else {
			await MessageUtils.send(msg.channel, {
				embeds: [command.message],
				files: [{ name: `${command.fileName}.png`, attachment: command.image }],
			});
			return;
		}
	}

	private async colourCommand(colour: string): Promise<{ message: EmbedBuilder; image?: Buffer; fileName?: string }> {
		let hexColour: string | undefined;
		let rgbColour: number[] | undefined;
		const hex = colour.match(/^(?:#|0x)([0-9a-f]{6})$/i);
		const rgb = colour.match(/(^\d{1,3})\s*,?\s*(\d{1,3})\s*,?\s*(\d{1,3}$)/i);

		if (!rgb && !hex) {
			return {
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Please provide a valid colour hexcode or RGB values.`),
			};
		}

		if (hex) {
			hexColour = hex[1];
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			const [red, green, blue] = hexColour.match(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i)!.slice(1);
			rgbColour = [parseInt(red, 16), parseInt(green, 16), parseInt(blue, 16)];
		} else if (rgb) {
			rgbColour = rgb.slice(1).map((c) => parseInt(c));
			const [red, green, blue] = rgbColour;
			hexColour = `${this.rgbToHex(red)}${this.rgbToHex(green)}${this.rgbToHex(blue)}`;
		}

		const hexValue = parseInt(hexColour as string, 16);
		if (hexValue < 0 || hexValue > 16777215) {
			return {
				message: new EmbedBuilder()
					.setTitle(`Error`)
					.setColor(botColours.error)
					.setDescription(`Please provide a valid hexcode colour`),
			};
		}

		for (const component of rgbColour as number[]) {
			if (component < 0 || component > 255) {
				return {
					message: new EmbedBuilder()
						.setTitle(`Error`)
						.setColor(botColours.error)
						.setDescription(`Please provide a valid RGB value.`),
				};
			}
		}

		const hsv = this.rgbToHsv(rgbColour as number[]);

		const htmlString = `<html> <style>* {margin:0; padding:0;}</style> <div style="background-color:${hexColour}; width:200px; height:200px"></div></html>`;
		const image = await sushiiUtils.getHTMLImage(htmlString, `200`, `200`);

		const embed = new EmbedBuilder({
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			title: `Colour \`#${hexColour!.toLowerCase()}\``,
			color: hexValue,
			image: { url: `attachment://${hexColour}.png` },
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			footer: {
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				text: `RGB: ${rgbColour!.join(`, `)} | HSV: ${hsv[0]}, ${hsv[1]}%, ${hsv[2]}%`,
			},
		});

		return { message: embed, image: image, fileName: hexColour as string };
	}
	private rgbToHex(colour: number): string {
		const hex: string = colour.toString(16);
		return hex.length === 1 ? `0` + hex : hex;
	}

	private rgbToHsv([red, green, blue]: number[]): number[] {
		red /= 255;
		green /= 255;
		blue /= 255;

		const max = Math.max(red, green, blue);
		const min = Math.min(red, green, blue);
		let hue: number, sat: number, val: number;
		// eslint-disable-next-line prefer-const
		val = Math.round(max * 100);

		const diff = max - min;
		// eslint-disable-next-line prefer-const
		sat = Math.round((max === 0 ? 0 : diff / max) * 100);

		if (max === min) {
			hue = 0;
		} else {
			switch (max) {
				case red:
					hue = (green - blue) / diff + 0;
					break;
				case green:
					hue = (blue - red) / diff + 2;
					break;
				case blue:
					hue = (red - green) / diff + 4;
					break;
			}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			hue! /= 6;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			if (hue! < 0) hue! += 1;
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			hue = Math.round(hue! * 360);
		}

		return [hue, sat, val];
	}
}
