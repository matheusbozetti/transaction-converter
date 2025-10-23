import { liveQuery } from "dexie";
import { useEffect, useState } from "react";
import { type Alias, db } from "./db";

export function useAliases() {
	const [aliases, setAliases] = useState<Alias[]>([]);

	useEffect(() => {
		const subscription = liveQuery(() => db.aliases.toArray()).subscribe({
			next: setAliases,
		});

		return () => subscription.unsubscribe();
	}, []);

	return aliases;
}
