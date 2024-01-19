import { type Socket } from "dgram";

export interface Discovery {
  socket?: Socket
  localAddr: LocalAddr
}

export interface LocalAddr {
  family: string
  port: number
  address: string
}

export enum DiscoverCommand {
  SEARCH,
  WAKEUP
}

export interface DiscoverPacket {
  cmd: DiscoverCommand
  protocol_version: string
  user_credential?: string

}
