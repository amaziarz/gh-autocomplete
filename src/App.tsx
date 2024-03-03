import { GhAutocomplete } from '@/components/GhAutocomplete';

export function App() {
  return (
    <main className="container mx-auto px-4 py-16">
      <h1 className="mb-8 text-3xl font-bold">GitHub Search</h1>
      <GhAutocomplete />
    </main>
  );
}
