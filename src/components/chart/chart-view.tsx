"use client";

import * as React from "react";
import {
  createChart,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type Time,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type LogicalRange,
} from "lightweight-charts";
import { ema, rsi, macd, bollingerBands } from "@/lib/indicators";

export type Interval = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

export interface ApiCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorConfig {
  ema20: boolean;
  ema50: boolean;
  ema200: boolean;
  bollinger: boolean;
  volume: boolean;
  rsi: boolean;
  macd: boolean;
}

export const DEFAULT_INDICATORS: IndicatorConfig = {
  ema20: true,
  ema50: true,
  ema200: false,
  bollinger: false,
  volume: true,
  rsi: false,
  macd: false,
};

interface ChartViewProps {
  candles: ApiCandle[];
  indicators?: IndicatorConfig;
  chartType?: "candles" | "line" | "area";
  height?: number;
  className?: string;
}

export function ChartView({
  candles,
  indicators = DEFAULT_INDICATORS,
  chartType = "candles",
  height = 520,
  className,
}: ChartViewProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const rsiContainerRef = React.useRef<HTMLDivElement | null>(null);
  const macdContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mainChart = React.useRef<IChartApi | null>(null);
  const rsiChart = React.useRef<IChartApi | null>(null);
  const macdChart = React.useRef<IChartApi | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#0a0a0a" },
        textColor: "#a1a1aa",
        fontSize: 11,
        fontFamily: "ui-monospace, SFMono-Regular, monospace",
      },
      grid: {
        vertLines: { color: "#1f1f23" },
        horzLines: { color: "#1f1f23" },
      },
      rightPriceScale: { borderColor: "#27272a" },
      timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
      crosshair: { mode: CrosshairMode.Normal },
      autoSize: true,
    });
    mainChart.current = chart;

    let priceSeries:
      | ISeriesApi<"Candlestick">
      | ISeriesApi<"Line">
      | ISeriesApi<"Area">;

    if (chartType === "candles") {
      priceSeries = chart.addCandlestickSeries({
        upColor: "#10b981",
        downColor: "#ef4444",
        borderUpColor: "#10b981",
        borderDownColor: "#ef4444",
        wickUpColor: "#10b981",
        wickDownColor: "#ef4444",
      });
      const data: CandlestickData[] = candles.map((c) => ({
        time: c.time as Time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      (priceSeries as ISeriesApi<"Candlestick">).setData(data);
    } else if (chartType === "line") {
      priceSeries = chart.addLineSeries({ color: "#60a5fa", lineWidth: 2 });
      const data: LineData[] = candles.map((c) => ({ time: c.time as Time, value: c.close }));
      (priceSeries as ISeriesApi<"Line">).setData(data);
    } else {
      priceSeries = chart.addAreaSeries({
        lineColor: "#60a5fa",
        topColor: "rgba(96,165,250,0.4)",
        bottomColor: "rgba(96,165,250,0.0)",
      });
      const data: LineData[] = candles.map((c) => ({ time: c.time as Time, value: c.close }));
      (priceSeries as ISeriesApi<"Area">).setData(data);
    }

    const closes = candles.map((c) => c.close);

    // EMAs
    const addEma = (period: number, color: string) => {
      const series = chart.addLineSeries({ color, lineWidth: 1, priceLineVisible: false });
      const e = ema(closes, period);
      series.setData(
        candles
          .map((c, i) => ({ time: c.time as Time, value: e[i] ?? NaN }))
          .filter((p) => Number.isFinite(p.value)) as LineData[],
      );
      return series;
    };
    if (indicators.ema20) addEma(20, "#fbbf24");
    if (indicators.ema50) addEma(50, "#f97316");
    if (indicators.ema200) addEma(200, "#a78bfa");

    // Bollinger
    if (indicators.bollinger) {
      const bb = bollingerBands(closes, 20, 2);
      const upper = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1, priceLineVisible: false });
      const middle = chart.addLineSeries({ color: "#a1a1aa", lineWidth: 1, priceLineVisible: false });
      const lower = chart.addLineSeries({ color: "#60a5fa", lineWidth: 1, priceLineVisible: false });
      const toData = (arr: (number | null)[]): LineData[] =>
        candles
          .map((c, i) => ({ time: c.time as Time, value: arr[i] ?? NaN }))
          .filter((p) => Number.isFinite(p.value)) as LineData[];
      upper.setData(toData(bb.upper));
      middle.setData(toData(bb.middle));
      lower.setData(toData(bb.lower));
    }

    // Volume
    if (indicators.volume) {
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        color: "#3f3f46",
      });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      const data: HistogramData[] = candles.map((c) => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)",
      }));
      volumeSeries.setData(data);
    }

    // RSI sub-chart
    if (indicators.rsi && rsiContainerRef.current) {
      const sub = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0a0a0a" },
          textColor: "#a1a1aa",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "#1f1f23" },
          horzLines: { color: "#1f1f23" },
        },
        rightPriceScale: { borderColor: "#27272a" },
        timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
        autoSize: true,
      });
      rsiChart.current = sub;
      const r = rsi(closes, 14);
      const series = sub.addLineSeries({ color: "#c084fc", lineWidth: 1 });
      series.setData(
        candles
          .map((c, i) => ({ time: c.time as Time, value: r[i] ?? NaN }))
          .filter((p) => Number.isFinite(p.value)) as LineData[],
      );
      series.createPriceLine({ price: 70, color: "#52525b", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "70" });
      series.createPriceLine({ price: 30, color: "#52525b", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, title: "30" });
    }

    // MACD sub-chart
    if (indicators.macd && macdContainerRef.current) {
      const sub = createChart(macdContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#0a0a0a" },
          textColor: "#a1a1aa",
          fontSize: 10,
        },
        grid: {
          vertLines: { color: "#1f1f23" },
          horzLines: { color: "#1f1f23" },
        },
        rightPriceScale: { borderColor: "#27272a" },
        timeScale: { borderColor: "#27272a", timeVisible: true, secondsVisible: false },
        autoSize: true,
      });
      macdChart.current = sub;
      const m = macd(closes);
      const macdLine = sub.addLineSeries({ color: "#60a5fa", lineWidth: 1 });
      const signalLine = sub.addLineSeries({ color: "#fbbf24", lineWidth: 1 });
      const hist = sub.addHistogramSeries({ priceFormat: { type: "volume" } });
      const toLineData = (arr: (number | null)[]): LineData[] =>
        candles
          .map((c, i) => ({ time: c.time as Time, value: arr[i] ?? NaN }))
          .filter((p) => Number.isFinite(p.value)) as LineData[];
      macdLine.setData(toLineData(m.macd));
      signalLine.setData(toLineData(m.signal));
      hist.setData(
        candles
          .map((c, i) => ({
            time: c.time as Time,
            value: m.histogram[i] ?? 0,
            color: (m.histogram[i] ?? 0) >= 0 ? "rgba(16,185,129,0.6)" : "rgba(239,68,68,0.6)",
          }))
          .filter((p) => p.value !== 0) as HistogramData[],
      );
    }

    chart.timeScale().fitContent();

    // Sync time scales of sub-charts
    const charts = [rsiChart.current, macdChart.current].filter(Boolean) as IChartApi[];
    const syncs = charts.map((c) => {
      const handler = (range: LogicalRange | null) => {
        if (range) chart.timeScale().setVisibleLogicalRange(range);
      };
      c.timeScale().subscribeVisibleLogicalRangeChange(handler);
      return { c, handler };
    });
    const mainHandler = (range: LogicalRange | null) => {
      if (!range) return;
      for (const c of charts) c.timeScale().setVisibleLogicalRange(range);
    };
    chart.timeScale().subscribeVisibleLogicalRangeChange(mainHandler);

    return () => {
      chart.timeScale().unsubscribeVisibleLogicalRangeChange(mainHandler);
      for (const { c, handler } of syncs) c.timeScale().unsubscribeVisibleLogicalRangeChange(handler);
      chart.remove();
      rsiChart.current?.remove();
      macdChart.current?.remove();
      rsiChart.current = null;
      macdChart.current = null;
      mainChart.current = null;
    };
  }, [candles, indicators, chartType]);

  return (
    <div className={className} style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
      {indicators.rsi && (
        <div ref={rsiContainerRef} className="mt-2 h-32 w-full border-t border-zinc-800" />
      )}
      {indicators.macd && (
        <div ref={macdContainerRef} className="mt-2 h-32 w-full border-t border-zinc-800" />
      )}
    </div>
  );
}
