import type { Transaction } from "../base";

export const name = "sicredi-debit";
export const description = "Sicredi - Débito";
export const extensions = [".ofx"];
export const aliasParser = (alias: string) => alias;

export function aliasReplacer(
	originalDescription: string,
	aliasMap: Record<string, string>[],
): string {
	const base = aliasParser(originalDescription);
	const alias = aliasMap.find((a) => a.original === base)?.alias || "";

	return alias;
}

function parseOfxDate(dateString: string): Date {
	const digits = dateString.match(/^\d+/)?.[0] || "";

	const timezoneMatch = dateString.match(/\[([+-]?\d+):/);
	const timezoneOffset = timezoneMatch ? parseInt(timezoneMatch[1], 10) : 0;

	const year = parseInt(digits.substring(0, 4), 10);
	const month = parseInt(digits.substring(4, 6), 10) - 1;
	const day = parseInt(digits.substring(6, 8), 10);
	const hour = parseInt(digits.substring(8, 10), 10) || 0;
	const minute = parseInt(digits.substring(10, 12), 10) || 0;
	const second = parseInt(digits.substring(12, 14), 10) || 0;

	const utcDate = Date.UTC(year, month, day, hour, minute, second);
	const offsetMs = timezoneOffset * 60 * 60 * 1000;

	return new Date(utcDate - offsetMs);
}

function extractEstablishmentName(description: string): string {
	let cleaned = description
		.replace(/^COMPRA\s+(DEBITO|CREDITO)\s+MASTER[-\s]*/i, "")
		.replace(/^CM\d+\s+/i, "");

	cleaned = cleaned
		.replace(/^DEBITO\s+(CONVENIOS|CONTA)[-\s]*/i, "")
		.replace(/ID\s+\d+\s+/i, "");

	if (
		cleaned.includes("RECEBIMENTO PIX SICREDI-") ||
		cleaned.includes("RECEBIMENTO PIX-PIX_CRED") ||
		cleaned.includes("PAGAMENTO PIX SICREDI-") ||
		cleaned.includes("PAGAMENTO PIX-PIX_DEB")
	) {
		const stringToReplace = "PIX -";
		return cleaned
			.replace("RECEBIMENTO PIX SICREDI-", stringToReplace)
			.replace("RECEBIMENTO PIX-PIX_CRED", stringToReplace)
			.replace("PAGAMENTO PIX SICREDI-", stringToReplace)
			.replace("PAGAMENTO PIX-PIX_DEB", stringToReplace)
			.trim();
	}

	if (cleaned.includes("LIQUIDACAO BOLETO-")) {
		return cleaned.replace("LIQUIDACAO BOLETO-", "Boleto -").trim();
	}

	const match = cleaned.match(/^([A-Z0-9\s]+?)\s{2,}/);

	if (match) {
		return match[1].trim();
	}

	return cleaned.split(/\s{2,}/)[0].trim() || cleaned.trim();
}

export async function parse(file: File): Promise<Transaction[]> {
	const text = await file.text();
	const transactions: Transaction[] = [];

	const transactionRegex =
		/<STMTTRN>[\s\S]*?<TRNTYPE>(.*?)<\/TRNTYPE>[\s\S]*?<DTPOSTED>(.*?)<\/DTPOSTED>[\s\S]*?<TRNAMT>(.*?)<\/TRNAMT>[\s\S]*?<MEMO>(.*?)<\/MEMO>/gi;

	let match;
	while ((match = transactionRegex.exec(text)) !== null) {
		const [, , dtposted, trnamt, memo] = match;

		transactions.push({
			date: parseOfxDate(dtposted),
			description: extractEstablishmentName(memo),
			amount: parseFloat(trnamt),
		});
	}

	return transactions;
}
