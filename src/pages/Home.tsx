import { saveAs } from "file-saver";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { exportDatabase, importDatabase } from "@/db/db";
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

	async function handleDBImport(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		await importDatabase(file);
		window.location.reload();
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
		<div className="p-6 max-w-6xl mx-auto space-y-8">
			<Card className="bg-blue-50">
				<CardHeader>
					<CardTitle>Banco de Dados Local</CardTitle>
					<CardDescription>
						Exporte ou importe suas preferências e apelidos salvos.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap items-center gap-4">
					<Button onClick={exportDatabase}>Exportar banco de dados</Button>

					<div className="flex flex-col">
						<Label htmlFor="importdb">Importar banco de dados</Label>
						<Input
							id="importdb"
							type="file"
							accept=".bin"
							onChange={handleDBImport}
							className="w-[250px]"
						/>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Conversão de Arquivos</CardTitle>
					<CardDescription>
						Escolha o formato de origem e destino, e depois importe seu arquivo.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-wrap items-end gap-6">
					<div className="flex flex-col gap-2">
						<Label htmlFor="origin">Origem do documento</Label>
						<Select value={importerKey} onValueChange={setImporterKey}>
							<SelectTrigger id="origin" className="w-[200px]">
								<SelectValue placeholder="Selecione" />
							</SelectTrigger>
							<SelectContent>
								{Object.keys(importers).map((k) => (
									<SelectItem key={k} value={k}>
										{importers[k].description}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="destination">Destino</Label>
						<Select value={exporterKey} onValueChange={setExporterKey}>
							<SelectTrigger id="destination" className="w-[200px]">
								<SelectValue placeholder="Selecione" />
							</SelectTrigger>
							<SelectContent>
								{Object.keys(exporters).map((k) => (
									<SelectItem key={k} value={k}>
										{exporters[k].description}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{exporterKey === "mobills" && (
						<div className="flex flex-col gap-2">
							<Label htmlFor="account">Conta para importação</Label>
							<Input
								id="account"
								value={account}
								onChange={(e) => setAccount(e.target.value)}
								placeholder="Ex: Nubank, Itaú..."
								className="w-[250px]"
							/>
						</div>
					)}
				</CardContent>

				{importerKey && exporterKey && (
					<CardContent>
						<Label htmlFor="file">Importar arquivo</Label>
						<Input
							id="file"
							type="file"
							accept={importers[importerKey].extensions.join(",")}
							onChange={handleFile}
						/>
					</CardContent>
				)}
			</Card>

			{transactions.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Transações Importadas</CardTitle>
						<CardDescription>
							Edite apelidos e categorias antes de exportar.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="overflow-x-auto rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Data</TableHead>
										<TableHead>Descrição</TableHead>
										<TableHead>Valor</TableHead>
										<TableHead>Apelido</TableHead>
										<TableHead>Categoria</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{transactions.map((t, i) => (
										<TableRow
											key={`${t.description}-${i}-${t.category}-${t.alias}`}
										>
											<TableCell>{t.date.toLocaleDateString()}</TableCell>
											<TableCell>{t.description}</TableCell>
											<TableCell
												className={`font-semibold ${
													t.amount < 0 ? "text-red-600" : "text-green-600"
												}`}
											>
												{Intl.NumberFormat("pt-BR", {
													style: "currency",
													currency: "BRL",
												}).format(t.amount)}
											</TableCell>
											<TableCell>
												<Input
													defaultValue={t.alias || ""}
													onBlur={(e) => {
														if (!e.target.value) return;
														handleSave(
															importers[importerKey].aliasParser(t.description),
															{ alias: e.target.value },
														).then((d) => mapAliases(transactions, d));
													}}
												/>
											</TableCell>
											<TableCell>
												<Input
													defaultValue={t.category || ""}
													onBlur={(e) => {
														if (!e.target.value) return;
														handleSave(
															importers[importerKey].aliasParser(t.description),
															{ category: e.target.value },
														).then((d) => mapAliases(transactions, d));
													}}
												/>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						<div className="flex justify-end mt-6">
							<Button onClick={exportFile}>Exportar CSV</Button>
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
