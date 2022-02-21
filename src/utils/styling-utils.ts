//import axios from 'axios';
//import color from 'color';
import Vibrant from 'node-vibrant';

export class stylingUtils {
	public static async urlToColours(url: string): Promise<number[]> {
		let colours: number[];
		try {
			/*
			const response = await axios.get(url, { responseType: `arraybuffer` });
			const hex = this.buf2hex(response.data);
			colours = hex;
            */
			//const colours = await color(hex)
			colours = (await Vibrant.from(url).getPalette()).Vibrant?.rgb as number[];
		} catch (error) {
			colours = [252, 211, 77];
		}
		return colours;
	}
}
