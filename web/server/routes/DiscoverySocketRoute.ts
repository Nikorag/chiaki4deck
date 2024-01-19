import { type Server, type Socket } from "socket.io";
import { type SonyConsole } from "../models/Core";
import { getRegisteredHosts } from "../service/RegistrationService";
import { type DiscoveryCallback, type DiscoveryStartCallback, getDiscoveryEnabled, initDiscovery, toggleDiscoveryEnabled, wakeup } from "../service/DiscoveryService";
import { WebChiakiConstants } from "../constants/WebChiakiConstants";
import { AbstractSocketRoute } from "./AbstractSocketRoute";

export class DiscoverySocketRoute extends AbstractSocketRoute {
	private discoveredHosts: SonyConsole[];
	private readonly hostDiscoveredCallback: DiscoveryCallback;
	private readonly discoveryStartingCallback: DiscoveryStartCallback;

	constructor (io: Server) {
		super(io);
		this.discoveredHosts = [];

		this.hostDiscoveredCallback = (sonyConsole: SonyConsole | null) => {
			if (sonyConsole) {
				this.discoveredHosts.push(sonyConsole);
			}
			io.emit("discovered_hosts", this.getHosts());
		};

		this.discoveryStartingCallback = () => {
			this.discoveredHosts = [];
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
			this.discoveredHosts = [];
			this.io.emit("discovered_hosts", this.getHosts());
			this.io.emit("discovery_enabled", getDiscoveryEnabled());
		});

		socket.on("wake", (data: SonyConsole) => {
			wakeup(data);
		});
	}

	getHosts (): SonyConsole[] {
		const registeredHosts: SonyConsole[] = getRegisteredHosts();
		const combinedHosts: SonyConsole[] = this.discoveredHosts.map((discoveredHost: SonyConsole): SonyConsole => {
			const registeredHost: SonyConsole | undefined = registeredHosts.find((h: SonyConsole) => h.hostId == discoveredHost.hostId);
			if (registeredHost) {
				const combined: SonyConsole = {
					...registeredHost,
					...discoveredHost,
					discovered: true
				};
				combined.registered = true;
				return combined;
			} else {
				return discoveredHost;
			}
		});

		combinedHosts.concat(registeredHosts.filter((h: SonyConsole) => !combinedHosts.find((ch: SonyConsole) => ch.hostId == h.hostId)));
		combinedHosts.sort((a: SonyConsole, b: SonyConsole) => a.hostId > b.hostId ? 1 : -1);
		return combinedHosts;
	}
}
