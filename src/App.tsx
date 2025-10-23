import { Home } from "./pages/Home";

export default function App() {
	return (
		<div className="min-h-screen bg-gray-50 text-gray-900">
			<header className="p-4 border-b font-semibold">
				Conversor de extratos financeiros
			</header>
			<main>
				<Home />
			</main>
		</div>
	);
}
