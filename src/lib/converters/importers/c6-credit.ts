import Papa from "papaparse";
import type { Transaction } from "../base";
import { parseDataBR } from "../helpers";

export const name = "c6-credit";
export const description = "C6 - Cartão de crédito";
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

	const { data } = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
		delimiter: ";",
		transformHeader: (header) => header.trim(),
		transform: (value) => value.trim(),
	});

	const transacoes: Transaction[] = data.reduce(
		(acc: Transaction[], row: any) => {
			let description = row["Descrição"];

			if (description.toLowerCase().includes("pagamento fatura")) {
				return acc;
			}

			if (row.Parcela && row.Parcela !== "Única") {
				description += ` - Parcela ${row.Parcela}`;
			}

			acc.push({
				date: parseDataBR(row["Data de Compra"]),
				description,
				amount: -Number(row["Valor (em R$)"]),
				category: "",
			});

			return acc;
		},
		[],
	);

	return transacoes;
}
