/* eslint-disable @typescript-eslint/typedef */
/* eslint-disable no-prototype-builtins */
import storage from "node-persist";
import { sleep } from "../utils/WebChiakiUtils";

let storageReady : boolean = false;

storage.init({logging: false, dir: "data"}).then(() => {
	console.log("Storage Ready");
	storageReady = true;
});



export async function getAll<T>(tableName: string) : Promise<Array<T>> {
	while (!storageReady){
		await sleep(50);
	}
	let storedArray : Array<T> = await storage.getItem(tableName);
	storedArray = storedArray ? storedArray : [];

	return storedArray;
}

export async function insert<T>(tableName: string, data: T, key : string): Promise<void> {
	while (!storageReady){
		await sleep(50);
	}

	let storedArray : Array<T> = await storage.getItem(tableName);
	storedArray = storedArray ? storedArray : [];

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-expect-error
	const existingIndex : number = storedArray.findIndex((i : T) => i[key] === data[key]);

	if (existingIndex > -1){
		storedArray[existingIndex] = data;
	} else {
		storedArray.push(data);
	}

	await storage.setItem(tableName, storedArray);
}