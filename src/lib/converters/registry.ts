const importerModules = import.meta.glob("./importers/*.ts", { eager: true });
const exporterModules = import.meta.glob("./exporters/*.ts", { eager: true });

export const importers = Object.fromEntries(
	Object.entries(importerModules).map(([path, mod]) => {
		const name = path.split("/")[2].replace(".ts", "");
		return [name, mod as any];
	}),
);

export const exporters = Object.fromEntries(
	Object.entries(exporterModules).map(([path, mod]) => {
		const name = path.split("/")[2].replace(".ts", "");
		return [name, mod as any];
	}),
);
