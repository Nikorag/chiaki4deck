/* eslint-disable */
export function checkConditionWithTimeout(condition: () => boolean, tick : number, timeoutMillis: number): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		let intervalId: NodeJS.Timeout;
		let timeoutId: NodeJS.Timeout;

		intervalId = setInterval(() => {
			if (condition()) {
				clearInterval(intervalId);
				clearTimeout(timeoutId); // Clear the timeout
				resolve();
			}
		}, tick); // Check every tick

		timeoutId = setTimeout(() => {
			clearInterval(intervalId);
			reject(new Error('Timeout exceeded'));
			}, timeoutMillis);
	});
}