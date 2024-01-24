import { Server, Socket } from "socket.io";
import { AbstractSocketRoute } from "./AbstractSocketRoute";
import { SocketConstants } from "../constants/SocketConstants";
import { ConsoleStatus, SonyConsole } from "../models/Core";
import { getRegisteredHostById } from "../service/RegistrationService";
import { getDiscoveredHostById } from "./DiscoverySocketRoute";
import { wakeup } from "../service/DiscoveryService";
import { checkConditionWithTimeout } from "../utils/WebChiakiUtils";
import {Chiaki, StreamSession} from "../models/Chiaki";
import bindings from "bindings";

const chiaki: Chiaki = bindings("web-chiaki");

export class StreamSocketRoute extends AbstractSocketRoute {

	constructor (io: Server) {
		super(io);
	}

	socketConnection (socket: Socket): void {
		socket.on(SocketConstants.START_STREAM_SUBJECT, async (host : string) => {
			const registered : SonyConsole | undefined = await getRegisteredHostById(host as string);
        
			if (registered) {
				console.log(registered);
				//Find the discovered one
				const discovered: SonyConsole | undefined = getDiscoveredHostById(host as string);
				const combined: SonyConsole = {
					...registered,
					...discovered
				};
				if (combined?.status != ConsoleStatus.READY) {
					wakeup(combined);
				}
        
				checkConditionWithTimeout(() => combined.status == ConsoleStatus.READY,
					1000, 45000)
					.then(() => {
						// eslint-disable-next-line @typescript-eslint/no-unused-vars
						const session: StreamSession = new chiaki.StreamSession(combined);
					});
			}
		});
	}
}