import DatabaseConstructor, { type Database, type Statement } from "better-sqlite3";

export function openDb (): Database {
	const db: Database = new DatabaseConstructor("data/web-chiaki.db");

	const createRegisteredHostsTable: string = "CREATE TABLE IF NOT EXISTS registered_hosts( \
    'address' varchar, \
    'status' integer, \
    'hostId' varchar PRIMARY KEY, \
    'hostType' integer, \
    'hostName' varchar, \
    'hostRequestPort' integer, \
    'deviceDiscoveryProtocolVersion' varchar, \
    'registKey' varchar, \
    'registered' varchar, \
    'discovered' varchar, \
    'systemVersion' varchar);";
	db.exec(createRegisteredHostsTable);

	// Some initialization
	return db;
}

export function insert (tableName: string, data: object): void {
	const db: Database = openDb();
	const columns: string[] = Object.keys(data);

	const placeholders: string = columns.map((c: string) => `:${c}`).join(", ");
	const columnsList: string = columns.join(", ");

	const insertStatement: string = `INSERT INTO ${tableName} (${columnsList}) VALUES (${placeholders})`;
	console.log(insertStatement);
	const insertCommand: Statement = db.prepare(insertStatement);
	insertCommand.run(data);

	db.close();
}
