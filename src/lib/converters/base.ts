export interface Transaction {
	date: Date;
	description: string;
	amount: number;
	category?: string;
	alias?: string;
}

export interface Importer {
	name: string;
	description: string;
	extensions: string[];
	parse(file: File): Promise<Transaction[]>;
}

export interface Exporter {
	name: string;
	description: string;
	generate(transactions: Transaction[]): string | Blob;
}
