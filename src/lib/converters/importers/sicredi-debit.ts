import { parse as OfxParser } from "ofx-parser";
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
	const month = parseInt(digits.substring(4, 6), 10) - 1; // mês é 0-indexed
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
		.replace(/ID\s+\d+\s+/i, ""); // Remove "ID 189995"

	const match = cleaned.match(/^([A-Z0-9\s]+?)\s{2,}/);

	if (match) {
		return match[1].trim();
	}

	return cleaned.split(/\s{2,}/)[0].trim() || cleaned.trim();
}

export async function parse(file: File): Promise<Transaction[]> {
	const text = await file.text();
	const parsed = await OfxParser(text);

	return (
		parsed.OFX.BANKMSGSRSV1 as any
	).STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN.map((t: any) => {
		const transaction: Transaction = {
			date: parseOfxDate(t.DTPOSTED),
			description: extractEstablishmentName(t.MEMO || t.NAME),
			amount: parseFloat(t.TRNAMT),
		};

		return transaction;
	});
}
