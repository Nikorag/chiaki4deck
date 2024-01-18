import {openDb, insert} from "./DataService";
import {ConsoleStatus, SonyConsole} from "../models/Core";
import bindings from 'bindings';
import {Chiaki, ChiakiRegisteredHost, ChiakiSearchResponse, Register} from "../models/Chiaki";
import { RegistrationForm } from "../models/Registration";
import { Database } from "better-sqlite3";

const chiaki : Chiaki = bindings("web-chiaki");

export type RegistrationSearchCallback = (address : string, port : number) => void;
export function getRegisteredHosts(): SonyConsole[] {
    const db : Database = openDb();
    const rows: unknown[] = db.prepare('SELECT * FROM registered_hosts').all();

    // Use type assertion to tell TypeScript that rows should be treated as SonyConsole[]
    const registeredHosts: SonyConsole[] = rows.map((row : unknown) => ({
        ...(row as SonyConsole),
        registered: true,
        discovered: false,
    }));

    db.close();

    return registeredHosts;
}

export function register(form : RegistrationForm) : SonyConsole {
    const register : Register = new chiaki.Register();
    const payload : Uint8Array = new Uint8Array(register.createPayload(form.addressType, form.psnOnlineId ? form.psnOnlineId : "", form.psnAccountId, form.pin));
    register.createHeader(form.addressType, payload.length);
    const searchResponse : ChiakiSearchResponse = register.startSearch(form.addressType, form.inputAddress);
    const registered_host : ChiakiRegisteredHost = register.connect(form.addressType, searchResponse.address, form.psnOnlineId ? form.psnOnlineId : "", form.psnAccountId, form.pin);
    const response : SonyConsole = {
        hostId : form.hostId,
        status: ConsoleStatus.UNKNOWN,
        registered: true,
        discovered: true,
        hostName: registered_host.server_nickname,
        registKey: registered_host.regist_key
    }
    insert("registered_hosts", response);
    return response;
}