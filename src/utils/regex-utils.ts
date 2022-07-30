import { ParseUtils } from "./parse-utils.js";

export class RegexUtils {
	public static regex(input: string): RegExp | void {
		// eslint-disable-next-line no-useless-escape
		const match = input.match(/^\/(.*)\/([^\/]*)$/);
		if (!match) {
			return;
		}

		return new RegExp(match[1], match[2]);
	}

	public static discordId(input: string): string {
		return input.match(/\b\d{17,20}\b/)?.[0] as string;
	}

	public static tag(input: string): { username: string; tag: string; discriminator: string } | void {
		const match = input.match(/\b(.+)#([\d]{4})\b/);
		if (!match) {
			return;
		}

		return {
			tag: match[0],
			username: match[1],
			discriminator: match[2],
		};
	}

	public static pageNumber(input: string): number | undefined {
		const match = this.findMatch(input, /Page (\d+)\/(\d+)/);
		if (!match) {
			return;
		}

		// Remove commas
		return ParseUtils.parseInt(match);
	}

	private static findMatch(input: string, regex: RegExp): string | undefined {
		const match = regex.exec(input);
		if (match) {
			return match[1];
		} else {
			return;
		}
	}
}
