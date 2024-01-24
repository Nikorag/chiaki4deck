import { type Socket } from "socket.io";
import { AbstractSocketRoute } from "./AbstractSocketRoute";
import { type RegistrationForm } from "../models/Registration";
import { register } from "../service/RegistrationService";
import { SocketConstants } from "../constants/SocketConstants";

export class RegisterSocketRoute extends AbstractSocketRoute {
	socketConnection (socket: Socket): void {
		socket.on(SocketConstants.REGISTER_SUBJECT, (form: RegistrationForm) => {
			register(form);
		});
	}
}
