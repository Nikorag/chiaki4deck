/* eslint-disable @typescript-eslint/no-misused-new */
import { type RegistrationAddressType } from "./Registration";
import {SonyConsole} from "./Core";

export interface Register {
  new (): Register
  createPayload: (addressType: RegistrationAddressType, psnOnlineId: string | undefined, psnAccountId: string, pin: string) => Iterable<number>
  createHeader: (addressType: RegistrationAddressType, size: number) => string
  startSearch: (addressType: RegistrationAddressType, address: string) => ChiakiSearchResponse
  connect: (addressType: RegistrationAddressType, address: string, psnOnlineId: string | undefined, psnAccountId: string, pin: string) => ChiakiRegisteredHost
}

export interface Wakeup {
  new (): Wakeup
  wake: (regist_key: string, address: string, ps5: boolean) => boolean
}

export interface StreamSession {
  new (console : SonyConsole) : StreamSession
}

export interface ChiakiSearchResponse {
  address: string
  port: number
}

export interface ChiakiRegisteredHost {
  server_nickname: string
  regist_key: string,
  morning : string
}

export interface Chiaki {
  Register : Register
  Wakeup : Wakeup
  StreamSession : StreamSession
}
