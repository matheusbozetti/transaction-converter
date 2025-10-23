import { type Alias, db } from "./db";

export async function upsertAlias(original: string, data: Partial<Alias>) {
	const existing = await db.aliases.where("original").equals(original).first();

	if (existing) {
		await db.aliases.update(existing.id!, { ...existing, ...data });
	} else {
		await db.aliases.add({ original, alias: "", category: "", ...data });
	}

	return await db.aliases.toArray();
}

export async function listAliases(): Promise<Alias[]> {
	return db.aliases.toArray();
}
