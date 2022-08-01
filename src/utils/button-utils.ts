export class ButtonUtils {
	public static getNewPageNum(pageNum: number, name: string): number | undefined {
		switch (name) {
		case `previous`:
			return pageNum - 1;
		case `next`:
			return pageNum + 1;
		default:
			return;
		}
	}
}
