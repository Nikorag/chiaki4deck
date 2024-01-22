export enum ConsoleStatus {
  STANDBY = 620,
  READY = 200,
  UNKNOWN = 0
}

export enum ConsoleType {
  PS4,
  PS5
}

export interface ChiakiStatus {
  registered?: boolean
  discovered?: boolean
  lastSeen?: Date
}

export interface SonyConsole {
  address?: string
  status: ConsoleStatus
  hostId: string
  hostType?: ConsoleType
  hostName?: string
  hostRequestPort?: number
  deviceDiscoveryProtocolVersion?: string
  systemVersion?: string
  registKey?: string
  morning?: string
  chiakiStatus?: ChiakiStatus
}