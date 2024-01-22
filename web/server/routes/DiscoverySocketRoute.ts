import { type Server, type Socket } from "socket.io";
import { type SonyConsole } from "../models/Core";
import { getRegisteredHosts } from "../service/RegistrationService";
import { type DiscoveryCallback, type DiscoveryStartCallback, getDiscoveryEnabled, initDiscovery, toggleDiscoveryEnabled, wakeup } from "../service/DiscoveryService";
import { WebChiakiConstants } from "../constants/WebChiakiConstants";
import { AbstractSocketRoute } from "./AbstractSocketRoute";

let discoveredHosts: SonyConsole[] = [];

export class DiscoverySocketRoute extends AbstractSocketRoute {
	private readonly hostDiscoveredCallback: DiscoveryCallback;
	private readonly discoveryStartingCallback: DiscoveryStartCallback;

	constructor (io: Server) {
		super(io);

		this.hostDiscoveredCallback = (sonyConsole: SonyConsole | null) => {
			if (sonyConsole) {
				const existingIndex : number = discoveredHosts.findIndex((host : SonyConsole) => host.hostId === sonyConsole.hostId);
				if (existingIndex > -1){
					discoveredHosts[existingIndex] = sonyConsole;
				} else {
					discoveredHosts.push(sonyConsole);
				}
			}
			io.emit("discovered_hosts", this.getHosts());
		};

		this.discoveryStartingCallback = () => {
			//Remove any consoles not seen for 6 seconds
			discoveredHosts = discoveredHosts.filter((host : SonyConsole) => {
				const sixSecondsAgo : Date = new Date();
				sixSecondsAgo.setSeconds(sixSecondsAgo.getSeconds() - 6);
				return host.chiakiStatus?.lastSeen && host.chiakiStatus.lastSeen > sixSecondsAgo;
			});
		};

		initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS4, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS4, this.hostDiscoveredCallback, this.discoveryStartingCallback);
		initDiscovery(WebChiakiConstants.CHIAKI_DISCOVERY_PROTOCOL_VERSION_PS5, WebChiakiConstants.CHIAKI_DISCOVERY_PORT_PS5, this.hostDiscoveredCallback, this.discoveryStartingCallback);
	}

	socketConnection (socket: Socket): void {
		socket.emit("discovered_hosts", this.getHosts());
		socket.emit("discovery_enabled", getDiscoveryEnabled());

		socket.on("toggleDiscovery", () => {
			toggleDiscoveryEnabled();
			console.log("Discvoery is " + getDiscoveryEnabled());
			discoveredHosts = [];
			this.io.emit("discovered_hosts", this.getHosts());
			this.io.emit("discovery_enabled", getDiscoveryEnabled());
		});

		socket.on("wake", (data: SonyConsole) => {
			wakeup(data);
		});
	}

	getHosts (): SonyConsole[] {
		const registeredHosts: SonyConsole[] = getRegisteredHosts();
		const combinedHosts: SonyConsole[] = discoveredHosts.map((discoveredHost: SonyConsole): SonyConsole => {
			const registeredHost: SonyConsole | undefined = registeredHosts.find((h: SonyConsole) => h.hostId == discoveredHost.hostId);
			if (registeredHost) {
				return {
					...registeredHost,
					...discoveredHost,
					chiakiStatus : {
						...discoveredHost.chiakiStatus,
						registered : true
					}
				};
			} else {
				return discoveredHost;
			}
		});

		combinedHosts.concat(registeredHosts.filter((h: SonyConsole) => !combinedHosts.find((ch: SonyConsole) => ch.hostId == h.hostId)));
		combinedHosts.sort((a: SonyConsole, b: SonyConsole) => a.hostId > b.hostId ? 1 : -1);
		return combinedHosts;
	}
}

export function getDiscoveredHostById (hostId : string) : SonyConsole | undefined {
	return discoveredHosts.find((h : SonyConsole) => h.hostId == hostId);
}