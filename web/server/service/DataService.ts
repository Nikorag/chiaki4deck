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
    'registKey' varchar, \
    'systemVersion' varchar);"
    db.exec(createRegisteredHostsTable);
    
    // Some initialization
    return db;
}

export function insert(tableName: string, data: any): void {
    let db : Database = openDb();
    const columns = Object.keys(data);
    const values = Object.values(data);

    const placeholders = columns.map(() => '?').join(', ');
    const columnsList = columns.join(', ');

    const insertStatement = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders})`;
    db.exec(insertStatement);

    db.close();
}