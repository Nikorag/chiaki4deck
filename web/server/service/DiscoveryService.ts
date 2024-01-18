import { WebChiakiConstants } from "../constants/WebChiakiConstants";
import { ConsoleStatus, ConsoleType, SonyConsole } from "../models/Core";
import { Discovery, LocalAddr, DiscoverPacket, DiscoverCommand } from "../models/Discovery";
import { createSocket, RemoteInfo, Socket } from 'dgram';

export type DiscoveryCallback = (sonyConsole: SonyConsole | null) => void;
export type DiscoveryStartCallback = () => void;

export function initDiscovery(protocol_version: string, callbackPort : number, callback: DiscoveryCallback, startingCallback : DiscoveryStartCallback): void {
    let addr: LocalAddr = {
        address: "0.0.0.0",
        family: "IPv4",
        port: WebChiakiConstants.CHIAKI_DISCOVERY_PORT_LOCAL_MIN
    }

    let discovery: Discovery = { localAddr: addr };
    discovery.socket = createSocket("udp4");

    discovery.socket?.on('error', (error : any) => {
        if (error.code === 'EADDRINUSE') {
            // Increase the port and try again
            addr.port++;
            if (addr.port > WebChiakiConstants.CHIAKI_DISCOVERY_PORT_LOCAL_MAX) {
                console.error('Exceeded maximum port limit. Exiting.');
                if (discovery.socket) {
                    discovery.socket.close();
                }
                process.exit(1);
            } else {
                attemptBind(discovery, addr.port, protocol_version, callbackPort, callback, startingCallback);
            }
        }  else {
            // Handle other errors
            console.error(`Unexpected error: ${error.message}`);
            if (discovery.socket) {
                discovery.socket.close();
            }
            process.exit(1);
        }
    });

    attemptBind(discovery, addr.port, protocol_version, callbackPort, callback, startingCallback);
}

function attemptBind(discovery: Discovery, port: number, protocol_version: string, callbackPort : number, callback: DiscoveryCallback, startingCallback : DiscoveryStartCallback) {
    console.log("Attempting to bind to port "+port);
    discovery.socket?.bind(port, undefined, () => {
        discovery.socket?.setBroadcast(true);
        let discoverPacket: Buffer | null = formatPacket({
            cmd: DiscoverCommand.SEARCH,
            protocol_version: protocol_version
        });

        if (discoverPacket !== null) {
            const packetUint8Array = Uint8Array.from(discoverPacket);
            sendDiscoveryPacket(startingCallback, discovery.socket, packetUint8Array, callbackPort);
            setInterval(() => {sendDiscoveryPacket(startingCallback, discovery.socket, packetUint8Array, callbackPort);}, 3000);
        } else {
            console.error('Discover packet is null. Cannot send.');
            if (discovery.socket) {
                discovery.socket.close();
            }
            process.exit(1);
        }

        // Listen for responses
        discovery.socket?.on('message', (msg, rinfo) => {
            callback(parseSonyConsoleString(msg.toString(), rinfo));
        });
    });
}

function sendDiscoveryPacket(startingCallback : DiscoveryStartCallback , socket : Socket | undefined, packet : Uint8Array, callbackPort : number){
    startingCallback();
    socket?.send(packet, 0, packet.length, callbackPort, '255.255.255.255', (err) => {
        if (err) {
            console.error('Error sending message:', err);
        } else {
            //console.log('Discover Message sent successfully');
        }
    });
}

export const parseSonyConsoleString = (input: string, remoteInfo : RemoteInfo): SonyConsole | null => {
    const lines = input.split('\n');
    const statusMatch = lines[0].match(/HTTP\/1.1 (\d+)\s(.*)/);

    if (!statusMatch) {
        return null;
    }

    const [, statusCode, statusText] = statusMatch;
    const consoleStatus = parseInt(statusCode, 10) as ConsoleStatus;

    const consoleInfo: Partial<SonyConsole> = {
        hostId: lines[1].split(':')[1].trim(),
        hostType: ConsoleType[lines[2].split(':')[1].trim() as keyof typeof ConsoleType],
        hostName: lines[3].split(':')[1].trim(),
        hostRequestPort: parseInt(lines[4].split(':')[1].trim(), 10),
        deviceDiscoveryProtocolVersion: lines[5].split(':')[1].trim(),
        systemVersion: lines[6].split(':')[1].trim(),
    };

    return {
        address: remoteInfo.address,
        status: consoleStatus,
        hostId: consoleInfo.hostId,
        hostType: consoleInfo.hostType,
        hostName: consoleInfo.hostName,
        hostRequestPort: consoleInfo.hostRequestPort,
        deviceDiscoveryProtocolVersion: consoleInfo.deviceDiscoveryProtocolVersion,
        systemVersion: consoleInfo.systemVersion,
        registered: false,
        discovered: true
    };
};

function formatPacket(packet: DiscoverPacket): Buffer | null {
    if (!packet.protocol_version) {
        return null;
    }

    switch (packet.cmd) {
        case DiscoverCommand.SEARCH:
            return Buffer.from(`SRCH * HTTP/1.1\ndevice-discovery-protocol-version:${packet.protocol_version}\n`, "utf-8");
        case DiscoverCommand.WAKEUP:
            return Buffer.from(`WAKEUP * HTTP/1.1\n` +
                `client-type:vr\n` +
                `auth-type:R\n` +
                `model:w\n` +
                `app-type:r\n` +
                `user-credential:${packet.user_credential}\n` +
                `device-discovery-protocol-version:${packet.protocol_version}\n\0`, "utf-8");
        default:
            return null;
    }
}
