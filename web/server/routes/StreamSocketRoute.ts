import { Server, Socket } from "socket.io";
import { AbstractSocketRoute } from "./AbstractSocketRoute";
import { SocketConstants } from "../constants/SocketConstants";
import { ConsoleStatus, SonyConsole } from "../models/Core";
import { getRegisteredHostById } from "../service/RegistrationService";
import { getDiscoveredHostById } from "./DiscoverySocketRoute";
import { wakeup } from "../service/DiscoveryService";
import { checkConditionWithTimeout } from "../utils/WebChiakiUtils";
import {Chiaki, StreamFrame, StreamSession} from "../models/Chiaki";
import bindings from "bindings";
import sharp from "sharp";

const chiaki: Chiaki = bindings("web-chiaki");

export class StreamSocketRoute extends AbstractSocketRoute {

	constructor (io: Server) {
		super(io);
	}

	socketConnection (socket: Socket): void {
		socket.on(SocketConstants.START_STREAM_SUBJECT, async (host : string) => {
			console.log("Starting stream for "+host);
			const registered : SonyConsole | undefined = await getRegisteredHostById(host as string);
        
			if (registered) {
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
						const session: StreamSession = new chiaki.StreamSession(combined, () => {
							const streamFrame : StreamFrame = session.getFrame();
							if (streamFrame && streamFrame.width && streamFrame.height){
								sharp(streamFrame.frameData, { raw: { width : streamFrame.width, height : streamFrame.height, channels: 4 } })
									.toFormat("jpeg")
									.toBuffer()
									.then((base64Image : Buffer) => {
									// Set the base64 image source
										socket.emit("image_data", `data:image/jpeg;base64,${base64Image.toString("base64")}`);
									})
									.catch((err : Error) => {
										console.error("Error converting frame to base64:", err);
									});
							}
						});
					});
			}
		});
	}
}