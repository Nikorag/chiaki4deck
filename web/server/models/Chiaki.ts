import {RegistrationAddressType} from "./Registration";

export type Register = {
    new () : Register
    createPayload : (addressType : RegistrationAddressType, psnOnlineId : string, psnAccountId : string, pin : string) => Iterable<number>
    createHeader : (addressType : RegistrationAddressType, size : number) => string
    startSearch : (addressType : RegistrationAddressType, address : string) => ChiakiSearchResponse
    connect : (addressType : RegistrationAddressType, address : string, psnOnlineId : string, psnAccountId : string, pin : string) => ChiakiRegisteredHost
}

export type ChiakiSearchResponse = {
    address : string,
    port : number
}

export type ChiakiRegisteredHost = {
    server_nickname : string,
    regist_key : string
}

export type Chiaki = {
    Register : Register
}