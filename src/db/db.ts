import Dexie, { type Table } from "dexie";
import "dexie-export-import";

export interface Alias {
	id?: number;
	original: string;
	alias: string;
	category: string;
}

export class AppDB extends Dexie {
	aliases!: Table<Alias, number>;

	constructor() {
		super("local_converter_db");
		this.version(1).stores({
			aliases: "++id, original, alias, category",
		});
	}
}

export let db = new AppDB();

export async function exportDatabase() {
	const blob = await db.export({ prettyJson: false });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `transaction-converter-${new Date().toISOString().substring(0, 10)}.bin`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importDatabase(file: File) {
	await db.delete();
	const newDb = new AppDB();
	await newDb.import(file);

	db = newDb;
}
