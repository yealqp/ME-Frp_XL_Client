import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useMessage } from "naive-ui";
import { invoke } from "@tauri-apps/api/core";
import type { TrafficStatsData } from "@/types/user";
import { handleApiError } from "@/utils/errorHandler";

export function useTrafficChart() {
  const message = useMessage();

  const chartContainer = ref<HTMLElement | null>(null);
  const trafficStatsLoading = ref(false);
  const datePeriod = ref(7);
  const rawTrafficStats = ref<TrafficStatsData | null>(null);
  const activeChartIndex = ref<number | null>(null);
  const chartBounds = ref({ width: 1000, height: 460 });
  let chartResizeObserver: ResizeObserver | null = null;

  const CHART_PADDING = {
    top: 36,
    right: 20,
    bottom: 40,
    left: 64,
  };

  const showCustomTooltip = ref(false);
  const customTooltipData = ref({
    date: "",
    trafficIn: 0,
    trafficOut: 0,
    totalTraffic: 0,
    unit: "KB",
    x: 0,
    y: 0,
  });

  const currentChartData = ref<{
    dates: string[];
    trafficIn: number[];
    trafficOut: number[];
    totalTraffic: number[];
    unit: string;
  } | null>(null);

  const chartModel = computed(() => {
    if (!rawTrafficStats.value || rawTrafficStats.value.dates.length === 0) {
      return null;
    }

    const data = rawTrafficStats.value;
    const chartWidth = chartBounds.value.width;
    const chartHeight = chartBounds.value.height;
    const trafficInKB = data.trafficIn.map((value) => Number((value / 1024).toFixed(2)));
    const trafficOutKB = data.trafficOut.map((value) => Number((value / 1024).toFixed(2)));
    const totalTrafficKB = data.totalTraffic.map((value) => Number((value / 1024).toFixed(2)));
    const maxValue = Math.max(...totalTrafficKB, 0);
    const useMB = maxValue > 1024;

    const trafficData = useMB
      ? {
          trafficIn: data.trafficIn.map((value) => Number((value / 1024 / 1024).toFixed(2))),
          trafficOut: data.trafficOut.map((value) => Number((value / 1024 / 1024).toFixed(2))),
          totalTraffic: data.totalTraffic.map((value) => Number((value / 1024 / 1024).toFixed(2))),
        }
      : {
          trafficIn: trafficInKB,
          trafficOut: trafficOutKB,
          totalTraffic: totalTrafficKB,
        };

    const unit = useMB ? "MB" : "KB";
    const plotWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;
    const plotHeight = chartHeight - CHART_PADDING.top - CHART_PADDING.bottom;
    const yMax = Math.max(...trafficData.totalTraffic, ...trafficData.trafficIn, ...trafficData.trafficOut, 1);
    const xStep = data.dates.length > 1 ? plotWidth / (data.dates.length - 1) : 0;

    const toPointY = (value: number) => CHART_PADDING.top + plotHeight - (value / yMax) * plotHeight;
    const toPointX = (index: number) => CHART_PADDING.left + index * xStep;

    const buildPath = (values: number[]) =>
      values
        .map((value, index) => `${index === 0 ? "M" : "L"} ${toPointX(index)} ${toPointY(value)}`)
        .join(" ");

    const buildAreaPath = (values: number[]) => {
      const linePath = buildPath(values);
      const lastX = toPointX(values.length - 1);
      const firstX = toPointX(0);
      const baselineY = CHART_PADDING.top + plotHeight;
      return `${linePath} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
    };

    const xLabels = data.dates.map((date, index) => {
      const dateObj = new Date(date);
      return {
        x: toPointX(index),
        label: `${dateObj.getMonth() + 1}-${dateObj.getDate()}`,
      };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4;
      const value = Number((yMax * (1 - ratio)).toFixed(2));
      const y = CHART_PADDING.top + plotHeight * ratio;
      return { value, y };
    });

    return {
      dates: data.dates,
      chartWidth,
      chartHeight,
      unit,
      trafficData,
      plotWidth,
      plotHeight,
      yMax,
      xLabels,
      yTicks,
      linePaths: {
        trafficIn: buildPath(trafficData.trafficIn),
        trafficOut: buildPath(trafficData.trafficOut),
        totalTraffic: buildPath(trafficData.totalTraffic),
      },
      areaPaths: {
        trafficIn: buildAreaPath(trafficData.trafficIn),
        trafficOut: buildAreaPath(trafficData.trafficOut),
        totalTraffic: buildAreaPath(trafficData.totalTraffic),
      },
      getPoint(index: number) {
        return {
          x: toPointX(index),
          trafficInY: toPointY(trafficData.trafficIn[index]),
          trafficOutY: toPointY(trafficData.trafficOut[index]),
          totalTrafficY: toPointY(trafficData.totalTraffic[index]),
        };
      },
    };
  });

  const activePoint = computed(() => {
    if (!chartModel.value || activeChartIndex.value === null) {
      return null;
    }
    return chartModel.value.getPoint(activeChartIndex.value);
  });

  function syncChartBounds(): void {
    if (!chartContainer.value) {
      return;
    }
    const { width, height } = chartContainer.value.getBoundingClientRect();
    if (width > 0 && height > 0) {
      chartBounds.value = { width, height };
    }
  }

  const loadTrafficStats = async () => {
    trafficStatsLoading.value = true;
    showCustomTooltip.value = false;
    activeChartIndex.value = null;

    try {
      const responseText = await invoke<string>("api_get_traffic_stats", {
        datePeriod: datePeriod.value,
      });
      const result = JSON.parse(responseText) as {
        code: number;
        message?: string;
        data?: TrafficStatsData;
      };

      if (result.code === 200 && result.data) {
        const trafficData: TrafficStatsData = result.data;
        updateChart(trafficData);
      } else {
        throw new Error(result.message || "获取流量统计失败");
      }
    } catch (error) {
      const errorMessage = handleApiError(error, "加载流量统计失败", "加载流量统计失败");
      message.error(errorMessage);
    } finally {
      trafficStatsLoading.value = false;
    }
  };

  function updateChart(data: TrafficStatsData) {
    rawTrafficStats.value = data;
    const model = chartModel.value;
    if (!model) {
      return;
    }

    currentChartData.value = {
      dates: data.dates,
      trafficIn: model.trafficData.trafficIn,
      trafficOut: model.trafficData.trafficOut,
      totalTraffic: model.trafficData.totalTraffic,
      unit: model.unit,
    };
  }

  const handleChartMouseEnter = () => undefined;

  const handleChartMouseMove = (event: MouseEvent) => {
    if (trafficStatsLoading.value || !chartModel.value) {
      showCustomTooltip.value = false;
      return;
    }

    if (!currentChartData.value || !chartContainer.value) {
      return;
    }

    const rect = chartContainer.value.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const gridLeft = CHART_PADDING.left;
    const gridRight = CHART_PADDING.right;
    const gridTop = CHART_PADDING.top;
    const gridBottom = CHART_PADDING.bottom;
    const gridWidth = rect.width - gridLeft - gridRight;

    if (
      mouseX < gridLeft ||
      mouseX > rect.width - gridRight ||
      mouseY < gridTop ||
      mouseY > rect.height - gridBottom
    ) {
      showCustomTooltip.value = false;
      activeChartIndex.value = null;
      return;
    }

    const relativeX = (mouseX - gridLeft) / gridWidth;
    const dataLength = currentChartData.value.dates.length;
    const dataIndex = Math.round(relativeX * (dataLength - 1));

    if (dataIndex < 0 || dataIndex >= dataLength) {
      showCustomTooltip.value = false;
      activeChartIndex.value = null;
      return;
    }

    const dateObj = new Date(currentChartData.value.dates[dataIndex]);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");

    const tooltipWidth = 200;
    const tooltipHeight = 150;
    const offset = 15;

    let tooltipX = event.clientX + offset;
    let tooltipY = event.clientY + offset;

    if (tooltipX + tooltipWidth > window.innerWidth) {
      tooltipX = event.clientX - tooltipWidth - offset;
    }

    if (tooltipY + tooltipHeight > window.innerHeight) {
      tooltipY = event.clientY - tooltipHeight - offset;
    }

    if (tooltipX < 0) {
      tooltipX = offset;
    }

    if (tooltipY < 0) {
      tooltipY = offset;
    }

    activeChartIndex.value = dataIndex;
    customTooltipData.value = {
      date: `${year}-${month}-${day}`,
      trafficIn: currentChartData.value.trafficIn[dataIndex] || 0,
      trafficOut: currentChartData.value.trafficOut[dataIndex] || 0,
      totalTraffic: currentChartData.value.totalTraffic[dataIndex] || 0,
      unit: currentChartData.value.unit,
      x: tooltipX,
      y: tooltipY,
    };

    showCustomTooltip.value = true;
  };

  const handleChartMouseLeave = () => {
    showCustomTooltip.value = false;
    activeChartIndex.value = null;
  };

  const changeDatePeriod = async (period: number) => {
    datePeriod.value = period;
    await loadTrafficStats();
  };

  onMounted(() => {
    nextTick(() => {
      syncChartBounds();
      if (chartContainer.value) {
        chartResizeObserver = new ResizeObserver(() => {
          syncChartBounds();
        });
        chartResizeObserver.observe(chartContainer.value);
      }
    });
  });

  onBeforeUnmount(() => {
    chartResizeObserver?.disconnect();
    chartResizeObserver = null;
  });

  return {
    chartContainer,
    trafficStatsLoading,
    datePeriod,
    showCustomTooltip,
    customTooltipData,
    chartModel,
    activePoint,
    CHART_PADDING,
    syncChartBounds,
    loadTrafficStats,
    handleChartMouseEnter,
    handleChartMouseMove,
    handleChartMouseLeave,
    changeDatePeriod,
  };
}
