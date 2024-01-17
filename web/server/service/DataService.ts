import DatabaseConstructor, {Database} from "better-sqlite3";

export function openDb(): Database {
    let db: Database = new DatabaseConstructor('data/web-chiaki.db');
    
    const createRegisteredHostsTable : string = "CREATE TABLE IF NOT EXISTS registered_hosts( \
    'address' varchar, \
    'status' integer, \
    'hostId' varchar PRIMARY KEY, \
    'hostType' integer, \
    'hostName' varchar, \
    'hostRequestPort' integer, \
    'deviceDiscoveryProtocolVersion' varchar, \
    'systemVersion' varchar);"
    db.exec(createRegisteredHostsTable);
    
    // Some initialization
    return db;
}