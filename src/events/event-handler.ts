export interface EventHandler {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	processIntr?(...args: any[]): Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	processMessage?(...args: any[]): Promise<void>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	process?(...args: any[]): Promise<void>;
}
