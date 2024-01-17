import {openDb} from "./DataService";
import {SonyConsole} from "../models/Core";
import {RegistrationAddressType, RegistrationForm} from "../models/Registration";
import {createSocket} from 'dgram';

const chiaki = require("bindings")("../../build/Release/web-chiaki.node");


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

    return registeredHosts;
}

export async function register(form : RegistrationForm) : Promise<void> {
    let register = new chiaki.Register();
    let payload : Uint8Array = new Uint8Array(register.createPayload(form.addressType, form.psnOnlineId, form.psnAccountId, form.pin));
    let header : string = register.createHeader(form.addressType, payload.length);

    search(form);    
}

function search(form : RegistrationForm){
    let src : string = form.addressType == RegistrationAddressType.ps5 ? "SRC3" : "SRC2";
    let res : string = form.addressType == RegistrationAddressType.ps5 ? "RES3" : "RES2";
    
    let socket = createSocket("udp4");
    socket.bind(9295, undefined, () => {
        socket.on('message', (msg, rinfo) => {
            console.log(msg.toString());
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