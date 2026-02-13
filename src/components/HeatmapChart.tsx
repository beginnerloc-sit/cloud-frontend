'use client';

interface HeatmapChartProps {
  title: string;
  xLabels: string[];
  yLabels: string[];
  data: number[][];
  loading?: boolean;
}

// Get color based on value (green to yellow to red gradient)
function getHeatmapColor(value: number, max: number): string {
  if (max === 0) return 'rgb(240, 240, 240)';
  
  const ratio = Math.min(value / max, 1);
  
  // Low values: green, Medium: yellow, High: red
  if (ratio < 0.33) {
    // Green to Yellow (low intensity)
    const r = Math.round(34 + (250 - 34) * (ratio / 0.33));
    const g = Math.round(197 + (204 - 197) * (ratio / 0.33));
    const b = Math.round(94 - 94 * (ratio / 0.33));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (ratio < 0.66) {
    // Yellow to Orange
    const adjustedRatio = (ratio - 0.33) / 0.33;
    const r = Math.round(250 - (250 - 249) * adjustedRatio);
    const g = Math.round(204 - (204 - 115) * adjustedRatio);
    const b = Math.round(0 + 22 * adjustedRatio);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Orange to Red
    const adjustedRatio = (ratio - 0.66) / 0.34;
    const r = Math.round(249 - (249 - 239) * adjustedRatio);
    const g = Math.round(115 - (115 - 68) * adjustedRatio);
    const b = Math.round(22 + (68 - 22) * adjustedRatio);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export default function HeatmapChart({ title, xLabels, yLabels, data, loading = false }: HeatmapChartProps) {
  // Find max value for color scaling
  const maxValue = data.reduce((max, row) => {
    const rowMax = Math.max(...row);
    return rowMax > max ? rowMax : max;
  }, 0);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse text-slate-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!data.length || !xLabels.length || !yLabels.length) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center text-slate-400">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
      
      <div className="overflow-x-auto">
        <div className="min-w-fit">
          {/* Header row with age groups */}
          <div className="flex">
            <div className="w-20 flex-shrink-0" /> {/* Empty corner cell */}
            {xLabels.map((label, i) => (
              <div 
                key={i} 
                className="flex-1 min-w-[80px] px-1 py-2 text-xs font-medium text-slate-600 text-center truncate"
                title={label}
              >
                {label.replace(' years old', '').replace(' and above', '+')}
              </div>
            ))}
          </div>

          {/* Data rows */}
          <div className="max-h-[400px] overflow-y-auto">
            {yLabels.map((weekLabel, rowIndex) => (
              <div key={rowIndex} className="flex">
                {/* Week label */}
                <div className="w-20 flex-shrink-0 px-2 py-1 text-xs text-slate-500 flex items-center">
                  {weekLabel}
                </div>
                {/* Data cells */}
                {data[rowIndex]?.map((value, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex-1 min-w-[80px] h-6 flex items-center justify-center text-xs font-medium border border-white/50"
                    style={{ 
                      backgroundColor: getHeatmapColor(value, maxValue),
                      color: value > maxValue * 0.5 ? 'white' : 'black'
                    }}
                    title={`${weekLabel}, ${xLabels[colIndex]}: ${value}`}
                  >
                    {value.toFixed(1)}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-xs text-slate-500">Low</span>
            <div className="flex h-4">
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio, i) => (
                <div
                  key={i}
                  className="w-8 h-full"
                  style={{ backgroundColor: getHeatmapColor(ratio * maxValue, maxValue) }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">High ({maxValue.toFixed(0)})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
