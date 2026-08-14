<template>
  <n-card :bordered="true" class="traffic-stats-card">
    <template #header>
      <SectionHeader :icon="TrendingUp" title="流量历史记录" />
    </template>
    <template #header-extra>
      <n-space>
        <n-button
          size="small"
          :type="datePeriod === 7 ? 'primary' : 'default'"
          @click="changeDatePeriod(7)"
        >
          7天
        </n-button>
        <n-button
          size="small"
          :type="datePeriod === 14 ? 'primary' : 'default'"
          @click="changeDatePeriod(14)"
        >
          14天
        </n-button>
        <n-button
          size="small"
          :type="datePeriod === 30 ? 'primary' : 'default'"
          @click="changeDatePeriod(30)"
        >
          30天
        </n-button>
      </n-space>
    </template>
    <div class="chart-wrapper">
      <div v-if="trafficStatsLoading" class="chart-loading">
        <n-spin size="large" />
      </div>
      <div
        ref="chartContainer"
        class="chart-container"
        :style="{ opacity: trafficStatsLoading ? 0 : 1 }"
        @mousemove="handleChartMouseMove"
        @mouseleave="handleChartMouseLeave"
      >
        <svg
          v-if="chartModel"
          class="traffic-chart"
          :viewBox="`0 0 ${chartModel.chartWidth} ${chartModel.chartHeight}`"
        >
          <defs>
            <linearGradient id="trafficInGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--app-primary-color)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--app-primary-color)" stop-opacity="0.05" />
            </linearGradient>
            <linearGradient id="trafficOutGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--app-success-color)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--app-success-color)" stop-opacity="0.05" />
            </linearGradient>
            <linearGradient id="totalTrafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="var(--app-warning-color)" stop-opacity="0.3" />
              <stop offset="100%" stop-color="var(--app-warning-color)" stop-opacity="0.05" />
            </linearGradient>
          </defs>

          <g class="chart-grid">
            <line
              v-for="tick in chartModel.yTicks"
              :key="tick.y"
              :x1="CHART_PADDING.left"
              :x2="chartModel.chartWidth - CHART_PADDING.right"
              :y1="tick.y"
              :y2="tick.y"
              class="chart-grid-line"
            />
            <text
              v-for="tick in chartModel.yTicks"
              :key="`${tick.y}-label`"
              :x="CHART_PADDING.left - 12"
              :y="tick.y + 4"
              class="chart-axis-text chart-axis-text-y"
            >
              {{ tick.value }}
            </text>
            <text
              v-for="label in chartModel.xLabels"
              :key="label.x"
              :x="label.x"
              :y="chartModel.chartHeight - 12"
              class="chart-axis-text chart-axis-text-x"
            >
              {{ label.label }}
            </text>
          </g>

          <g class="chart-areas">
            <path :d="chartModel.areaPaths.trafficIn" fill="url(#trafficInGradient)" />
            <path :d="chartModel.areaPaths.trafficOut" fill="url(#trafficOutGradient)" />
            <path :d="chartModel.areaPaths.totalTraffic" fill="url(#totalTrafficGradient)" />
          </g>

          <g class="chart-lines">
            <path :d="chartModel.linePaths.trafficIn" class="chart-line chart-line-primary" />
            <path :d="chartModel.linePaths.trafficOut" class="chart-line chart-line-success" />
            <path :d="chartModel.linePaths.totalTraffic" class="chart-line chart-line-warning" />
          </g>

          <g v-if="activePoint" class="chart-active-marker">
            <line
              :x1="activePoint.x"
              :x2="activePoint.x"
              :y1="CHART_PADDING.top"
              :y2="chartModel.chartHeight - CHART_PADDING.bottom"
              class="chart-active-line"
            />
            <circle :cx="activePoint.x" :cy="activePoint.trafficInY" r="4" class="chart-dot chart-dot-primary" />
            <circle :cx="activePoint.x" :cy="activePoint.trafficOutY" r="4" class="chart-dot chart-dot-success" />
            <circle :cx="activePoint.x" :cy="activePoint.totalTrafficY" r="4" class="chart-dot chart-dot-warning" />
          </g>
        </svg>
      </div>

      <!-- 加载时的遮罩层，阻止鼠标事件 -->
      <div
        v-if="trafficStatsLoading"
        class="chart-loading-mask"
        @mouseenter.stop
        @mousemove.stop
        @mouseleave.stop
        @click.stop
      ></div>

      <!-- 自定义 Tooltip - 使用 NCard -->
      <n-card
        v-if="showCustomTooltip && !trafficStatsLoading"
        class="custom-tooltip"
        :bordered="true"
        size="small"
        :style="{
          left: customTooltipData.x + 'px',
          top: customTooltipData.y + 'px',
        }"
      >
        <div class="tooltip-date">{{ customTooltipData.date }}</div>
        <div class="tooltip-content">
          <div class="tooltip-item">
            <span class="tooltip-label"
              >下载流量: {{ customTooltipData.trafficOut }}
              {{ customTooltipData.unit }}</span
            >
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label"
              >上传流量: {{ customTooltipData.trafficIn }}
              {{ customTooltipData.unit }}</span
            >
          </div>
          <div class="tooltip-item">
            <span class="tooltip-label"
              >总流量: {{ customTooltipData.totalTraffic }}
              {{ customTooltipData.unit }}</span
            >
          </div>
        </div>
      </n-card>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { TrendingUp } from "@lucide/vue";
import SectionHeader from "@/components/common/SectionHeader.vue";
import { useTrafficChart } from "@/composables/useTrafficChart";

const {
  chartContainer,
  trafficStatsLoading,
  datePeriod,
  showCustomTooltip,
  customTooltipData,
  chartModel,
  activePoint,
  CHART_PADDING,
  loadTrafficStats,
  handleChartMouseMove,
  handleChartMouseLeave,
  changeDatePeriod,
} = useTrafficChart();

onMounted(() => {
  void loadTrafficStats();
});
</script>

<style scoped>
.traffic-stats-card {
  background: var(--app-card-color);
  border: 1px solid var(--app-border-color);
  position: relative;
  z-index: 1;
}

.chart-wrapper {
  position: relative;
  width: 100%;
  height: 460px;
  min-height: 460px;
  z-index: 1;
}

.chart-container {
  width: 100%;
  height: 100%;
  transition: opacity 0.3s ease;
  position: relative;
  z-index: 1;
}

.traffic-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.chart-grid-line {
  stroke: var(--app-divider-color);
  stroke-width: 1;
}

.chart-axis-text {
  fill: var(--app-text-color-3);
  font-size: 13px;
  font-weight: 500;
  text-rendering: geometricPrecision;
}

.chart-axis-text-x {
  text-anchor: middle;
}

.chart-axis-text-y {
  text-anchor: end;
}

.chart-line {
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.chart-line-primary {
  stroke: var(--app-primary-color);
}

.chart-line-success {
  stroke: var(--app-success-color);
}

.chart-line-warning {
  stroke: var(--app-warning-color);
}

.chart-active-line {
  stroke: var(--app-primary-color);
  stroke-width: 2;
  stroke-dasharray: 4 4;
  opacity: 0.8;
}

.chart-dot {
  stroke-width: 2;
  fill: var(--app-card-color);
}

.chart-dot-primary {
  stroke: var(--app-primary-color);
}

.chart-dot-success {
  stroke: var(--app-success-color);
}

.chart-dot-warning {
  stroke: var(--app-warning-color);
}

.chart-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  cursor: default;
  pointer-events: all;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: var(--app-card-color);
  opacity: 0.9;
  z-index: 10;
  pointer-events: none; /* 加载层不阻止鼠标事件 */
}

.chart-loading p {
  color: var(--app-text-color-3);
  font-size: 14px;
  margin: 0;
}

/* 自定义 Tooltip 样式 - 使用 NCard */
.custom-tooltip {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  min-width: 140px;
  max-width: 200px;
  box-shadow: var(--app-box-shadow-2) !important;
  background: var(--app-card-color) !important;
  border-color: var(--app-border-color) !important;
}

.custom-tooltip :deep(.n-card__content) {
  padding: 8px 12px !important;
}

.tooltip-date {
  font-size: 15px;
  font-weight: 600;
  color: var(--app-text-color-1) !important;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--app-divider-color);
}

.tooltip-content {
  font-size: 13px;
  line-height: 2;
}

.tooltip-item {
  margin-bottom: 4px;
}

.tooltip-item:last-child {
  margin-bottom: 0;
}

.tooltip-label {
  color: var(--app-text-color) !important;
}
</style>
