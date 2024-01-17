import { Socket } from 'dgram';

export type Discovery = {
    socket? : Socket;
    localAddr: LocalAddr;
}

export type LocalAddr = {
    family : string;
    port : number;
    address : string;
}

export enum DiscoverCommand {
    SEARCH,
    WAKEUP
}

export type DiscoverPacket = {
    cmd : DiscoverCommand;
    protocol_version : string;
    user_credential? : string;

}