import Papa from "papaparse";
import type { Transaction } from "../base";
import { parseDataBR } from "../helpers";

export const name = "nubank-debit";
export const description = "Nubank - Conta corrente";
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

function sanitizeDescription(description: string): string {
	return description
		.replace("Transferência enviada pelo Pix - ", "")
		.replace("Transferência recebida pelo Pix - ", "")
		.replace("Compra no débito - ", "")
		.trim()
		.substring(0, 70);
}

export async function parse(file: File): Promise<Transaction[]> {
	return new Promise((resolve, reject) => {
		Papa.parse(file, {
			header: true,
			complete: (result) => {
				console.log(result);
				const txs: Transaction[] = (result.data as any[]).reduce(
					(acc, transaction) => {
						if (!transaction["Valor"]) return acc;

						const description = sanitizeDescription(transaction["Descrição"]);

						acc.push({
							date: parseDataBR(transaction["Data"]),
							description,
							amount: parseFloat(transaction["Valor"]),
							category: "",
						});

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
