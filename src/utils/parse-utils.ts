export class ParseUtils {
	public static parseInt(input: string): number | undefined {
		let int: number;
		try {
			int = parseInt(input.replaceAll(`,`, ``));
		} catch {
			return;
		}
		return int;
	}
}