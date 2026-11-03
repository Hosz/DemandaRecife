import { AlertPanel } from "../components/AlertPanel";
import { DemandHeatmap } from "../components/DemandHeatmap";
import { ShiftGrid } from "../components/ShiftGrid";

export default function EquipePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="mb-6">
        <p className="eyebrow">Escalas de trabalho</p>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Equipe e turnos
        </h1>
        <p className="mt-2 text-sm text-muted">
          Veja onde há previsão de mais movimento e aloque a equipe nos turnos.
        </p>
      </header>

      <div className="space-y-6">
        <AlertPanel />
        <DemandHeatmap />
        <ShiftGrid />
      </div>
    </main>
  );
}