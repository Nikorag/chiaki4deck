import express, {type Request, type Response, type Router} from "express";
import bindings from "bindings";
import {Chiaki, StreamSession} from "../models/Chiaki";
import {getRegisteredHostById} from "../service/RegistrationService";
import {ConsoleStatus, SonyConsole} from "../models/Core";
import {wakeup} from "../service/DiscoveryService";
import { checkConditionWithTimeout } from "../utils/WebChiakiUtils";
import { getDiscoveredHostById } from "./DiscoverySocketRoute";

const chiaki: Chiaki = bindings("web-chiaki");

const router: Router = express.Router();

router.get("/", (req: Request, res: Response) => {
	res.render("index", {});
});

router.get("/standbyExecuteDialog", (req : Request, res : Response) => {
	res.render("standbyExecute", {"layout" : false});
});

router.get("/register", (req: Request, res: Response) => {
	res.render("register", {"layout" : false});
});

router.post("/streamWindow", (req : Request, res : Response) => {
	//Create a stream settings object from the request
	res.render("stream", {"layout" : false});
});

router.get("/stream", async (req : Request, res : Response) => {
	const host : unknown = req.query.hostId;
	const registered : SonyConsole | undefined = await getRegisteredHostById(host as string);

	if (!registered) {
		res.redirect("/");
	} else {
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
				res.json({"Hello": "world"});
			}).catch((error: Error) => res.json(error));
	}
});

export default router;