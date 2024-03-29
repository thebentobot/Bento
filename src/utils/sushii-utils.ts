import axios from "axios";
import * as dotenv from 'dotenv';
dotenv.config();

// https://github.com/sushiibot/sushii-image-server
export class sushiiUtils {
	// localhost when on windows
	// 0.0.0.0 when on mac
	public static async getHTMLImage(html: string, width: string, height: string, type = `png`): Promise<Buffer> {
		return await axios({
			method: `post`,
			url: `http://${process.env.imageserverhost}:3000/html`,
			data: {
				html: html,
				width: width,
				height: height,
				imageFormat: type,
				quality: 100,
			},
			responseType: `arraybuffer`,
		}).then((res) => Buffer.from(res.data));
	}
}