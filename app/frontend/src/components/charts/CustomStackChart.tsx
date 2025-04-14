import { BarChart } from "@mui/x-charts/BarChart";


interface CustomStackBarsProps {
  data: Record<string, { date: string; value: number }[]>; // ✅ Märkte mit Datum & Wert
}

export default function CustomStackBars({ data }: CustomStackBarsProps) {
  if (!data || Object.keys(data).length === 0) {
    return <p>Keine Daten verfügbar</p>;
  }

  // 🔹 Alle einzigartigen Datumswerte extrahieren & sortieren
  const xAxisValues = Array.from(
    new Set(
      Object.values(data).flatMap((marketData) => marketData.map((d) => d.date))
    )
  ).sort();

  // 🔹 `dataset` so formatieren, dass jedes Objekt eine Zeile mit Datum & Werten für alle Märkte ist
  const dataset = xAxisValues.map((date) => {
    const entry: Record<string, number | string> = { date }; // `date` bleibt String für die X-Achse
    Object.keys(data).forEach((market) => {
      const marketEntry = data[market].find((d) => d.date === date);
      entry[market] = marketEntry ? marketEntry.value : 0; // Falls kein Wert für diesen Tag, 0 setzen
    });
    return entry;
  });

  return (
    <BarChart
      dataset={dataset.filter((entry) =>
        Object.keys(entry).some(
          (key) => key !== "date" && Number(entry[key]) > 0 // 🔥 Explizite Konvertierung zu Number
        )
      )}
      series={Object.keys(data).map((market) => ({
        dataKey: market,
        label: market,
        stack: 'total',
      }))}
      xAxis={[{ scaleType: "band", dataKey: "date" }]}
      
      slotProps={{
        legend: {
          hidden: false,
          position: { vertical: 'top', horizontal: 'middle' },
          labelStyle: { fontSize: '0.6rem' }
        }
      }}
      height={245}
      margin={{ bottom: 20, left: 100 }}
      
    />
  );
  
  
}
