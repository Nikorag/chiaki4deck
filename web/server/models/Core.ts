export enum ConsoleStatus {
    STANDBY = 620,
    READY = 200,
    UNKNOWN = 0
}

export enum ConsoleType {
    PS4,
    PS5
}

export type SonyConsole = {
    address? : string;
    status : ConsoleStatus;
    hostId? : string;
    hostType? : ConsoleType;
    hostName? : string;
    hostRequestPort? : number;
    deviceDiscoveryProtocolVersion? : string;
    systemVersion? : string;
    registered : Boolean;
    discovered : Boolean;
    registKey? : string;
}