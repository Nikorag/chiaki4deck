export enum ConsoleStatus {
    STANDBY,
    READY,
    UNKNOWN
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
}