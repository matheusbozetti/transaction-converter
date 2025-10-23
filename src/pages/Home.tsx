import { saveAs } from "file-saver";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { upsertAlias } from "@/db/aliasService";
import { useAliases } from "@/db/useAliases";
import type { Transaction } from "../lib/converters/base";
import { exporters, importers } from "../lib/converters/registry";

export function Home() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [importerKey, setImporterKey] = useState("");
	const [exporterKey, setExporterKey] = useState("");
	const [account, setAccount] = useState("Carteira");

	const aliases = useAliases();

	function mapAliases(txs: Transaction[], aliasList = aliases) {
		const mapped = txs.map((t: Transaction) => {
			const category =
				aliasList.find(
					(a) =>
						a.original === importers[importerKey].aliasParser(t.description),
				)?.category || "";

			return {
				...t,
				alias: importers[importerKey].aliasReplacer(t.description, aliasList),
				category,
			};
		});
		setTransactions(mapped);
	}

	async function handleSave(original: string, data: Record<string, unknown>) {
		return upsertAlias(original, data);
	}

	async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const importer = importers[importerKey];
		const txs = await importer.parse(file);
		mapAliases(txs);

		e.target.value = "";
	}

	async function exportFile() {
		const exporter = exporters[exporterKey];
		const content = exporter.generate(transactions, account);
		const now = new Date();
		saveAs(
			new Blob([content], { type: "text/csv;charset=utf-8;" }),
			`${exporterKey}-${now.getFullYear()}_${String(now.getMonth()).padStart(2, "0")}_${String(now.getDay()).padStart(2, "0")}-${now.getTime()}.csv`,
		);
	}

	return (
		<div className="p-6 space-y-4">
			<div className="flex gap-4">
				<Label htmlFor="origin">Origem do documento</Label>
				<Select value={importerKey} onValueChange={(v) => setImporterKey(v)}>
					<SelectTrigger id="origin" className="w-[180px]">
						<SelectValue placeholder="Selecione" />
					</SelectTrigger>
					<SelectContent onChange={(e) => console.log(e)}>
						{Object.keys(importers).map((k) => (
							<SelectItem key={k} value={k}>
								{importers[k].description}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Label htmlFor="destination" className="ml-2">
					Destino
				</Label>
				<Select value={exporterKey} onValueChange={(v) => setExporterKey(v)}>
					<SelectTrigger id="destination" className="w-[180px]">
						<SelectValue placeholder="Selecione" />
					</SelectTrigger>
					<SelectContent onChange={(e) => console.log(e)}>
						{Object.keys(exporters).map((k) => (
							<SelectItem key={k} value={k}>
								{exporters[k].description}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{exporterKey && exporterKey === "mobills" && (
				<>
					<Label htmlFor="account">Conta para importação</Label>
					<input
						id="account"
						className="border px-2"
						defaultValue={account}
						onChange={(e) => setAccount(e.target.value)}
					/>
				</>
			)}

			{importerKey && exporterKey && (
				<Input
					type="file"
					accept={importers[importerKey].extensions.join(",")}
					onChange={handleFile}
				/>
			)}
			{transactions.length > 0 && (
				<>
					<Table className="w-full border mt-4">
						<TableHeader>
							<TableRow>
								<TableHead className="font-bold">Data</TableHead>
								<TableHead className="font-bold">Descrição</TableHead>
								<TableHead className="font-bold">Valor</TableHead>
								<TableHead className="font-bold">Apelido</TableHead>
								<TableHead className="font-bold">Categoria</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{transactions.map((t, i) => (
								<TableRow
									key={`${t.description}-${t.alias}-${i}-${t.category}`}
								>
									<TableCell>{t.date.toLocaleDateString()}</TableCell>

									<TableCell>{t.description}</TableCell>
									<TableCell
										className={`font-bold ${t.amount < 0 ? "text-red-700" : ""}`}
									>
										{Intl.NumberFormat("pt-BR", {
											style: "currency",
											currency: "BRL",
										}).format(t.amount)}
									</TableCell>
									<TableCell>
										<input
											className="border px-2"
											defaultValue={t.alias || ""}
											onBlur={(e) => {
												if (!e.target.value) return;
												handleSave(
													importers[importerKey].aliasParser(t.description),
													{
														alias: importers[importerKey].aliasParser(
															e.target.value,
														),
													},
												).then((d) => {
													mapAliases(transactions, d);
												});
											}}
										/>
									</TableCell>
									<TableCell>
										<input
											className="border px-2"
											defaultValue={t.category || ""}
											onBlur={(e) => {
												if (!e.target.value) return;
												handleSave(
													importers[importerKey].aliasParser(t.description),
													{
														category: e.target.value,
													},
												).then((d) => {
													mapAliases(transactions, d);
												});
											}}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<Button
						className="mt-4 bg-blue-600 text-white px-3 py-2 rounded"
						onClick={exportFile}
					>
						Exportar CSV
					</Button>
				</>
			)}
		</div>
	);
}
