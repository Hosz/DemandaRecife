const HOURS = [8, 10, 12, 14, 16, 18, 20, 22];

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

// Movimento previsto por dia e faixa de 2h: 0 baixo, 1 médio, 2 alto, 3 pico.
// Dados de exemplo. Depois trocar pela previsão vinda da API.
const FLOW: number[][] = [
  [0, 1, 2, 1, 1, 2, 1, 0],
  [0, 1, 2, 1, 1, 2, 1, 0],
  [0, 1, 2, 2, 1, 2, 1, 0],
  [0, 1, 2, 1, 2, 2, 2, 1],
  [0, 1, 2, 2, 2, 3, 3, 2],
  [1, 2, 2, 2, 3, 3, 3, 2],
  [1, 2, 3, 2, 2, 1, 1, 0],
];

const LEVEL_LABEL = ["Baixo", "Médio", "Alto", "Pico"];

const LEVEL_STYLE = ["bg-white/5", "bg-acid/20", "bg-acid/50", "bg-acid"];

export function DemandHeatmap() {
  return (
    <section className="panel">
      <h2 className="section-title">Movimento previsto</h2>
      <p className="mt-1 text-sm text-muted">
        Quanto mais forte a cor, maior o fluxo de clientes esperado. Cada coluna
        cobre 2 horas a partir do horário indicado.
      </p>

      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[28rem] grid-cols-[3rem_repeat(8,1fr)] gap-1.5">
          <div />
          {HOURS.map((hour) => (
            <div key={hour} className="text-center text-xs text-muted">
              {hour}h
            </div>
          ))}

          {DAYS.map((day, dayIndex) => (
            <div key={day} className="contents">
              <div className="flex items-center text-xs font-semibold text-muted">
                {day}
              </div>
              {FLOW[dayIndex].map((level, hourIndex) => (
                <div
                  key={HOURS[hourIndex]}
                  role="img"
                  aria-label={`${day} ${HOURS[hourIndex]}h: ${LEVEL_LABEL[level]}`}
                  title={`${day} ${HOURS[hourIndex]}h: ${LEVEL_LABEL[level]}`}
                  className={`h-9 rounded-lg ${LEVEL_STYLE[level]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted">
        {LEVEL_LABEL.map((label, level) => (
          <span key={label} className="flex items-center gap-1.5">
            <span
              className={`size-3 rounded border border-white/10 ${LEVEL_STYLE[level]}`}
            />
            {label}
          </span>
        ))}
      </div>
    </section>
  );
}