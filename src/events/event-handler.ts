export interface EventHandler {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	process(...args: any[]): Promise<void>;
}
