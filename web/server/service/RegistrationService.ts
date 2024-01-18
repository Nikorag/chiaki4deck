import {openDb, insert} from "./DataService";
import {ConsoleStatus, SonyConsole} from "../models/Core";
import {RegistrationAddressType, RegistrationForm} from "../models/Registration";
import {createSocket, RemoteInfo} from 'dgram';
import * as net from 'net';

const chiaki = require("bindings")("../../build/Release/web-chiaki.node");

export type RegistrationSearchCallback = (address : string, port : number) => void;

function printObjectPropertiesAndMethods(obj : any) {
    console.log("Object Properties:");
    for (let prop in obj) {
        console.log(prop);
    }

    console.log("\nObject Methods:");
    for (let method in obj) {
        if (typeof obj[method] === 'function') {
            console.log(method);
        }
    }
}

export function getRegisteredHosts(): SonyConsole[] {
    let db = openDb();
    const rows: unknown[] = db.prepare('SELECT * FROM registered_hosts').all();

    // Use type assertion to tell TypeScript that rows should be treated as SonyConsole[]
    const registeredHosts: SonyConsole[] = rows.map((row) => ({
        ...(row as SonyConsole),
        registered: true,
        discovered: false,
    }));

    db.close();

    return registeredHosts;
}

export function register(form : RegistrationForm) : SonyConsole {
    let register = new chiaki.Register();
    let payload : Uint8Array = new Uint8Array(register.createPayload(form.addressType, form.psnOnlineId, form.psnAccountId, form.pin));
    let header : string = register.createHeader(form.addressType, payload.length);
    let searchResponse = register.startSearch(form.addressType, form.inputAddress);
    let registered_host = register.connect(form.addressType, searchResponse.address, form.psnOnlineId, form.psnAccountId, form.pin);
    let response : SonyConsole = {
        status: ConsoleStatus.UNKNOWN,
        registered: true,
        discovered: true,
        hostName: registered_host.server_nickname,
        registKey: registered_host.regist_key
    }
    insert("registered_hosts", response);
    return response;
}

function search(form : RegistrationForm, callback : RegistrationSearchCallback){
    let src : string = form.addressType == RegistrationAddressType.ps5 ? "SRC3" : "SRC2";
    let res : string = form.addressType == RegistrationAddressType.ps5 ? "RES3" : "RES2";
    
    let socket = createSocket("udp4");
    socket.bind(9295, undefined, () => {
        socket.on('message', (msg : Buffer, rinfo : RemoteInfo) => {
            console.log("Register callback");
            //Playstation should respond to tell us which port
            callback(rinfo.address, rinfo.port);
        });

        socket.send(src, 0, src.length, 9295, form.inputAddress, (err) => {
            if (err) {
                console.error('Error sending message:', err);
            } else {
                console.log('Register Message sent successfully');
            }
        });

    });
}

function registerRequest(form : RegistrationForm, address : string, payload : Uint8Array, header : string, port : number){
    const client = net.createConnection({host : address, port : port}, () => {

        client.on('data', (data) => {
            console.log(`Received from server: ${data}`);
            client.end(); // Close the connection after receiving the response
        });

        client.write(header);
        //client.write(payload);
    });
}