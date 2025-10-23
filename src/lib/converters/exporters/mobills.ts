import type { Transaction } from "../base";

export const name = "mobills";
export const description = "Mobills";
export const extensions = [".csv"];

export function generate(
	transactions: Transaction[],
	account: string = "Carteira",
): string {
	const header = ["Data", "Descrição", "Valor", "Conta", "Categoria"];
	const rows = transactions.map((t) => [
		t.date.toLocaleDateString(),
		t.alias || t.description,
		t.amount.toFixed(2),
		account,
		t.category || "Outros",
	]);

	const csv = [header, ...rows]
		.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"))
		.join("\n");

	return csv;
}
