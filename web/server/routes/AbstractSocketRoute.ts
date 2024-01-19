import { type Server, type Socket } from "socket.io";

export abstract class AbstractSocketRoute {
	protected io: Server;

	constructor (io: Server) {
		this.io = io;
	}

  abstract socketConnection (socket: Socket): void
}
