import Dexie, { type Table } from "dexie";

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

export const db = new AppDB();
