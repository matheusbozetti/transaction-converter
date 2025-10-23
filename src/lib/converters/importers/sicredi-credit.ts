import Papa from "papaparse";
import type { Transaction } from "../base";

export const name = "sicredi-credit";
export const description = "Sicredi - Cartão de crédito";
export const extensions = [".csv"];
export const aliasParser = (alias: string) => {
	return alias.replace(/\s*-\s*Parcela\s*\d+\/\d+/i, "").trim();
};

export function aliasReplacer(
	originalDescription: string,
	aliasMap: Record<string, string>[],
): string {
	const base = aliasParser(originalDescription);
	const alias = aliasMap.find((a) => a.original === base)?.alias || "";

	if (!alias) return "";

	const parcelaSuffix =
		originalDescription.match(/-\s*Parcela\s*\d+\/\d+/i)?.[0]?.trim() ?? "";

	return parcelaSuffix ? `${alias} ${parcelaSuffix}` : alias;
}

export async function parse(file: File): Promise<Transaction[]> {
	const csv = await file.text();

	const lines = csv
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	const startIndex = lines.findIndex(
		(l) => l.startsWith("Data") && l.includes("Descrição"),
	);

	if (startIndex === -1) return [];

	const transacoesCSV = lines.slice(startIndex).join("\n");

	const { data } = Papa.parse(transacoesCSV, {
		header: true,
		skipEmptyLines: true,
		delimiter: ";",
		transformHeader: (header) => header.trim(),
		transform: (value) => value.trim(),
	});

	const transacoes: Transaction[] = data.reduce(
		(acc: Transaction[], row: any) => {
			let description = row.Descrição;

			if (description.toLowerCase().includes("pag fat")) {
				return acc;
			}
			const valorStr = row.Valor?.toString() ?? "";
			const valor = parseFloat(
				valorStr
					.replace(/[^\d,-]/g, "")
					.replace(".", "")
					.replace(",", "."),
			);

			if (row.Parcela) {
				description += ` - Parcela ${row.Parcela.replace("(", "").replace(")", "")}`;
			}

			acc.push({
				date: new Date(row.Data.split("/").reverse().join("-") + "T00:00:00"),
				description,
				amount: Number.isNaN(valor) ? 0 : -valor,
				category: "",
			});

			return acc;
		},
		[],
	);

	return transacoes;
}
