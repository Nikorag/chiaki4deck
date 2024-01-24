import {getAll, insert} from "./DataService";
import { ConsoleStatus, type SonyConsole } from "../models/Core";
import bindings from "bindings";
import { type Chiaki, type ChiakiRegisteredHost, type ChiakiSearchResponse, type Register } from "../models/Chiaki";
import { type RegistrationForm } from "../models/Registration";

const chiaki: Chiaki = bindings("web-chiaki");

export type RegistrationSearchCallback = (address: string, port: number) => void
export async function getRegisteredHosts (): Promise<SonyConsole[]> {
	const rows : SonyConsole[] = await getAll<SonyConsole>("registered_hosts");

	// Use type assertion to tell TypeScript that rows should be treated as SonyConsole[]
	const registeredHosts: SonyConsole[] = rows.map((row: unknown) => ({
		...(row as SonyConsole),
		registered: true,
		discovered: false
	}));

	return registeredHosts;
}

export async function getRegisteredHostById (hostId : string) : Promise<SonyConsole | undefined> {
	const registeredHosts : SonyConsole[] = await getRegisteredHosts();
	console.log(registeredHosts);
	return registeredHosts.find((h : SonyConsole) => h.hostId == hostId);
}

export function register (form: RegistrationForm): Partial<SonyConsole> {
	const register: Register = new chiaki.Register();
	const searchResponse: ChiakiSearchResponse = register.startSearch(form.addressType, form.inputAddress);
	const registered_host: ChiakiRegisteredHost = register.connect(form.addressType, searchResponse.address, form.psnOnlineId, form.psnAccountId, form.pin);
	const response: Partial<SonyConsole> = {
		hostId: form.hostId,
		status: ConsoleStatus.UNKNOWN,
		hostName: registered_host.server_nickname,
		registKey: registered_host.regist_key,
		morning: registered_host.morning
	};
	insert("registered_hosts", response, "hostId");
	return response;
}
