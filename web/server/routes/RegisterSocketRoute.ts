import { type Socket } from "socket.io";
import { AbstractSocketRoute } from "./AbstractSocketRoute";
import { type RegistrationForm } from "../models/Registration";
import { register } from "../service/RegistrationService";

export class RegisterSocketRoute extends AbstractSocketRoute {
	socketConnection (socket: Socket): void {
		socket.on("register", (form: RegistrationForm) => {
			register(form);
		});
	}
}
