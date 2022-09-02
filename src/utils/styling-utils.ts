//import axios from 'axios';
//import color from 'color';
import { HexColorString } from 'discord.js';
import Vibrant from 'node-vibrant';

export class stylingUtils {
	public static async urlToColours(url: string): Promise<number[]> {
		let colours: number[];
		try {
			colours = (await Vibrant.from(url).getPalette()).Vibrant?.rgb as number[];
		} catch (error) {
			colours = [252, 211, 77];
		}
		return colours;
	}
	public static trim(str: string, max: number): string {
		const trimmed = str.length > max ? `${str.slice(0, max - 3)}...` : str;
		return trimmed;
	}
	public static capitalizeFirstCharacter(s: string): string {
		return s.charAt(0).toUpperCase() + s.slice(1);
	}
	public static nFormatter(num: number, digits: number) {
		const lookup = [
			{ value: 1, symbol: `` },
			{ value: 1e3, symbol: `k` },
			{ value: 1e6, symbol: `M` },
			{ value: 1e9, symbol: `G` },
			{ value: 1e12, symbol: `T` },
			{ value: 1e15, symbol: `P` },
			{ value: 1e18, symbol: `E` },
		];
		const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
		const item = lookup
			.slice()
			.reverse()
			.find(function (item) {
				return num >= item.value;
			});
		return item ? (num / item.value).toFixed(digits).replace(rx, `$1`) + item.symbol : `0`;
	}
}

export const botColours = {
	openWeatherAPI: `#EB6E4B` as HexColorString,
	error: `#FF0000` as HexColorString,
	success: `#22c55e` as HexColorString,
	bento: `#fde047` as HexColorString,
};
