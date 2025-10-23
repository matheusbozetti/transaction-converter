export function parseDataBR(data: string): Date {
	if (!data || !/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return new Date();

	const [dia, mes, ano] = data.split("/").map(Number);
	return new Date(ano, mes - 1, dia); // mês começa em 0 (jan = 0)
}
