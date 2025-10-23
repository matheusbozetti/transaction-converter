import Papa from "papaparse";
import type { Transaction } from "../base";
import { parseDataBR } from "../helpers";

export const name = "nubank";
export const description = "Nubank - Cartão de crédito";
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
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: true,
			complete: (result) => {
				const txs: Transaction[] = (result.data as any[]).reduce(
					(acc, transaction) => {
						if (!transaction["amount"]) return acc;

						if (!transaction["amount"].includes("-")) {
							acc.push({
								date: parseDataBR(transaction["date"]),
								description: transaction["title"],
								amount: -parseFloat(transaction["amount"]),
								category: "",
							});
						}

						return acc;
					},
					[],
				);
				resolve(txs);
			},
			error: reject,
		});
	});
}
