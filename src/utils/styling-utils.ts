//import axios from 'axios';
//import color from 'color';
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
}
