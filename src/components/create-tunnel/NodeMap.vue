<template>
  <div class="node-map-wrapper">
    <!-- 地图模式选项 -->
    <div class="map-scope-tabs">
      <n-tabs v-model:value="mapScope" type="segment" size="small">
        <n-tab-pane name="china" tab="中国" />
        <n-tab-pane name="oversea" tab="海外" />
      </n-tabs>
    </div>

    <div v-if="loading" class="node-map-loading">
      <n-spin size="small" />
      <n-text depth="3" style="margin-left: 8px;">节点加载中，稍候显示地图…</n-text>
    </div>

    <!-- 定位授权弹窗 -->
    <n-modal
      v-model:show="showGeoConsent"
      preset="dialog"
      title="地理位置授权"
      :show-icon="false"
      style="width: 420px;"
    >
      <div>
        <n-text>我们需要获取您的定位信息、IP 地址，以在节点地图上显示您的大致位置并推荐就近节点。</n-text>
        <n-text depth="3" style="margin-top: 8px; display: block;">
          您的定位信息仅会在本地进行匹配处理，不会进行任何形式的收集或上传。
        </n-text>
      </div>
      <template #action>
        <n-button size="small" @click="showGeoConsent = false">暂不授权</n-button>
        <n-button size="small" type="primary" @click="onGeoConsentAccept">允许</n-button>
      </template>
    </n-modal>

    <!-- 定位提示横幅 -->
    <div v-if="!userLocation" style="margin-bottom: 8px;">
      <n-alert
        v-if="!hasGeoConsent"
        type="warning"
        :show-icon="true"
        :bordered="false"
      >
        <template #header>
          <n-space align="center" justify="space-between" :wrap="false" style="width: 100%; gap: 12px;">
            <span>开启定位以在地图上显示您的位置</span>
            <n-button quaternary size="small" @click="fetchUserLocation">允许定位</n-button>
          </n-space>
        </template>
      </n-alert>
      <n-alert
        v-else
        type="info"
        :show-icon="true"
        :bordered="false"
      >
        <template #header>
          <n-space align="center" justify="space-between" :wrap="false" style="width: 100%; gap: 12px;">
            <span>正在获取精确位置…</span>
            <n-button quaternary size="small" @click="doFetchLocation">重新定位</n-button>
          </n-space>
        </template>
      </n-alert>
    </div>

    <div class="world-map" ref="worldMapRef" :style="{ height: mapHeight + 'px' }">
      <div
        ref="echartDom"
        class="echart-container"
        style="width: 100%; height: 100%; user-select: none; background: transparent;"
      />
    </div>

    <!-- 集群节点选择弹窗 -->
    <n-modal
      v-model:show="showClusterPicker"
      preset="card"
      :title="clusterPickerTitle"
      style="width: 760px; max-width: 92vw;"
      :mask-closable="false"
    >
      <n-text depth="3">该地区有 {{ clusterPickerNodes.length }} 个节点，请选择一个节点</n-text>
      <div class="nodes-grid" style="padding-top: 12px;">
        <NodeCard
          v-for="node in clusterPickerNodes"
          :key="node.nodeId"
          :node="node"
          :load-percent="getNodeLoadPercent(node.nodeId)"
          :selected="selectedNodeId === node.nodeId"
          :user-group="props.userGroup || ''"
          @select="handleClusterNodeSelect"
        />
      </div>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { init as initE, registerMap as registerEChartsMap } from "echarts";
import { feature as topoFeature, merge } from "topojson-client";
import { useThemeVars, useMessage } from "naive-ui";
import type { Node, NodeStatus } from "@/types/node";
import NodeCard from "./NodeCard.vue";
import {
  regionGeoMap,
  defaultGeoByRegion,
  continentGeoMap,
  getContinentByCoords,
  idToContinent,
} from "@/constants/nodeMap";
import { parseRgbColor, mixRgbColor, isDarkRgbColor } from "@/utils/color";

interface Props {
  nodes: Node[];
  nodeStatus: NodeStatus[];
  selectedNodeId: number | null;
  loading: boolean;
  userGroup?: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: "select-node", node: Node): void;
}>();

const themeVars = useThemeVars();
const mapScope = ref<"china" | "oversea">("china");
const worldMapRef = ref<HTMLDivElement | null>(null);
const echartDom = ref<HTMLDivElement | null>(null);
const mapHeight = ref(420);
const showClusterPicker = ref(false);
const clusterPickerTitle = ref("选择节点");
const clusterPickerNodes = ref<Node[]>([]);

let chartInstance: any = null;

// ── 节点负载 ──

function getNodeLoadPercent(nodeId: number): number {
  const status = props.nodeStatus.find((s) => s.nodeId === nodeId);
  return status?.loadPercent ?? 0;
}

function getProgressStatus(load: number): "success" | "info" | "warning" | "error" {
  if (load < 40) return "success";
  if (load < 60) return "info";
  if (load < 90) return "warning";
  return "error";
}

// ── 节点名解析（从节点名提取地区信息） ──

const circledNumbers = "①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳";

function parseNodeName(name: string): { region: string; numIndex: number } {
  let region = name || "";
  let numIndex = -1;

  for (let i = 0; i < circledNumbers.length; i++) {
    const char = circledNumbers[i];
    const idx = region.indexOf(char);
    if (idx !== -1) {
      numIndex = i + 1;
      region = region.substring(0, idx).trim();
      return { region, numIndex };
    }
  }

  const match = region.match(/^(.*?)\s*(\d+)$/);
  if (match) {
    region = match[1].trim();
    numIndex = Number.parseInt(match[2]);
  }

  return { region, numIndex };
}

function normalizeRegionName(raw: string): string {
  const value = (raw || "")
    .trim()
    .replace(/[·•]/g, "")
    .replace(/\s+/g, "")
    .replace(/(节点|地区|机房|数据中心)$/g, "")
    .replace(/^(中国大陆|大陆)/g, "");

  const aliasMap: Record<string, string> = {
    中国香港: "香港",
    香港特别行政区: "香港",
    中国澳门: "澳门",
    澳门特别行政区: "澳门",
    中国台湾: "台湾",
    台湾省: "台湾",
    台灣: "台湾",
    臺灣: "台湾",
    台北市: "台北",
    首尔: "首爾",
    首爾: "首爾",
    纽约: "纽约",
    紐約: "纽约",
    洛杉矶: "洛杉矶",
    三藩市: "旧金山",
  };

  return aliasMap[value] || value;
}

// ── 区域 -> 经纬度映射 ──



// ── 地图集群计算 ──

interface MapCluster {
  regionName: string;
  regionType: string;
  geoCoord: [number, number];
  nodes: Node[];
  avgLoad: number;
}

const mapClusters = computed<MapCluster[]>(() => {
  if (!props.nodes.length) return [];
  if (!props.nodes.some((n) => n.region)) return [];

  const nodesByScope = props.nodes.filter((node) => {
    const r = (node.region || "").toLowerCase();
    if (mapScope.value === "china") return r !== "oversea";
    return r === "oversea";
  });

  // 海外按大洲聚合
  if (mapScope.value === "oversea") {
    const grouped = new Map<string, Node[]>();
    nodesByScope.forEach((node) => {
      const parsed = parseNodeName(node.name || "");
      const rawRegion = parsed.region || "";
      const parts = rawRegion.split("/").map((p) => normalizeRegionName(p.trim())).reverse();
      let coords: [number, number] | null = null;
      for (const part of parts) {
        if (regionGeoMap[part]) {
          coords = regionGeoMap[part];
          break;
        }
      }
      if (
        !coords &&
        node.longitude != null &&
        node.latitude != null &&
        Number.isFinite(node.longitude) &&
        Number.isFinite(node.latitude)
      ) {
        coords = [node.longitude, node.latitude];
      }
      const continent = coords ? getContinentByCoords(coords[0], coords[1]) : "其他";
      if (!grouped.has(continent)) grouped.set(continent, []);
      grouped.get(continent)!.push(node);
    });

    return Array.from(grouped.entries()).map(([continent, nodes]) => ({
      regionName: continent,
      regionType: "oversea" as const,
      geoCoord: continentGeoMap[continent] || [0, 20],
      nodes: nodes.slice().sort((a, b) => a.nodeId - b.nodeId),
      avgLoad:
        nodes.reduce((sum, node) => sum + getNodeLoadPercent(node.nodeId), 0) /
        Math.max(nodes.length, 1),
    }));
  }

  // 国内按省份聚合
  const grouped = new Map<string, Node[]>();
  nodesByScope.forEach((node) => {
    const parsed = parseNodeName(node.name || "");
    const rawRegion = parsed.region || "";
    const province = normalizeRegionName(rawRegion.split("/")[0].trim()) || "中国";
    const groupKey = `${node.region}|${province}`;
    if (!grouped.has(groupKey)) grouped.set(groupKey, []);
    grouped.get(groupKey)!.push(node);
  });

  const clusters: MapCluster[] = [];
  grouped.forEach((nodes, groupKey) => {
    const [regionType, regionNameRaw] = groupKey.split("|") as ["cn" | "cnos" | "oversea", string];
    const regionName = normalizeRegionName(regionNameRaw);

    const exactCoords = nodes
      .filter(
        (n) =>
          n.longitude != null &&
          n.latitude != null &&
          Number.isFinite(n.longitude) &&
          Number.isFinite(n.latitude),
      )
      .map((n) => [n.longitude!, n.latitude!] as [number, number]);

    let geoCoord: [number, number];
    if (exactCoords.length > 0) {
      geoCoord = [
        exactCoords.reduce((sum, [lng]) => sum + lng, 0) / exactCoords.length,
        exactCoords.reduce((sum, [, lat]) => sum + lat, 0) / exactCoords.length,
      ];
    } else if (regionGeoMap[regionName]) {
      geoCoord = regionGeoMap[regionName];
    } else {
      geoCoord = defaultGeoByRegion(regionType);
    }

    clusters.push({
      regionName,
      regionType,
      geoCoord,
      nodes: nodes.slice().sort((a, b) => a.nodeId - b.nodeId),
      avgLoad:
        nodes.reduce((sum, node) => sum + getNodeLoadPercent(node.nodeId), 0) /
        Math.max(nodes.length, 1),
    });
  });

  return clusters;
});

// ── 用户定位 ──

const message = useMessage();
const userLocation = ref<[number, number] | null>(null);
const showGeoConsent = ref(false);
const hasGeoConsent = ref(!!localStorage.getItem("accept_using_geo_info"));

const ipFallback = async () => {
  try {
    const { getGeoIp } = await import("@/api/system");
    const data = await getGeoIp();
    if (data.longitude != null && data.latitude != null) {
      userLocation.value = [data.longitude, data.latitude];
    }
  } catch {
    /* 定位失败，不显示用户点 */
  }
};

const doFetchLocation = async () => {
  if (navigator.geolocation) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        userLocation.value = [pos.coords.longitude, pos.coords.latitude];
        return;
      } catch {
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500));
        }
      }
    }
    message.warning("精确地理位置获取失败，将使用 IP 定位");
  }
  await ipFallback();
};

const fetchUserLocation = () => {
  const accepted = localStorage.getItem("accept_using_geo_info");
  if (!accepted) {
    showGeoConsent.value = true;
    return;
  }
  doFetchLocation();
};

const onGeoConsentAccept = () => {
  localStorage.setItem("accept_using_geo_info", "true");
  hasGeoConsent.value = true;
  showGeoConsent.value = false;
  doFetchLocation();
};

// ── 地图渲染 ──

function getMapThemeColors() {
  const vars = themeVars.value;
  const boardColor = vars.cardColor || "#ffffff";
  const isDarkBg = isDarkRgbColor(boardColor);
  return {
    boardColor,
    borderColor: isDarkBg ? mixRgbColor(boardColor, "#ffffff", 0.35) : mixRgbColor(boardColor, "#000000", 0.28),
    mapFillColor: isDarkBg ? mixRgbColor(boardColor, "#ffffff", 0.06) : mixRgbColor(boardColor, "#000000", 0.08),
    emphasisColor: isDarkBg ? mixRgbColor(boardColor, "#ffffff", 0.12) : mixRgbColor(boardColor, "#000000", 0.14),
    isDarkBg,
  };
}

const isMobile = ref(window.innerWidth <= 768);

function updateMapHeight() {
  if (!worldMapRef.value) return;
  const parent = worldMapRef.value.parentElement;
  const parentWidth = parent?.clientWidth || 800;
  // 海外地图 2:1 → height = width/2；中国地图接近方形 → 偏大一点
  const aspectRatio = mapScope.value === "oversea" ? 2 : 1.05;
  const heightFromWidth = Math.floor(parentWidth / aspectRatio);
  const vh = window.innerHeight;
  const maxHeight = isMobile.value
    ? Math.min(340, Math.floor(vh * 0.44))
    : Math.floor(vh * 0.65);
  mapHeight.value = Math.max(300, Math.min(maxHeight, heightFromWidth));
}

// ── 地图数据加载 ──

const loadChinaMap = async () => {
  try {
    const resp = await fetch("/maps/china.json");
    const china = await resp.json();
    registerEChartsMap("china", china as any);
  } catch (err) {
    console.warn("Failed to load china map:", err);
  }
};

const loadWorldMap = async () => {
  try {
    const resp = await fetch("/maps/world-countries-110m.json");
    const worldData = await resp.json();

    const continentGeoms: Record<string, any[]> = {
      北美洲: [], 南美洲: [], 欧洲: [], 非洲: [], 亚洲: [], 大洋洲: [],
    };
    for (const geom of worldData.objects.countries.geometries) {
      const id = Number(geom.id);
      if (id === 10) continue;
      const continent = idToContinent[id];
      if (continent) continentGeoms[continent].push(geom);
    }

    const features = Object.entries(continentGeoms)
      .filter(([, geoms]) => geoms.length > 0)
      .map(([continent, geoms]) => ({
        type: "Feature" as const,
        id: continent,
        properties: { name: continent },
        geometry: merge(worldData, geoms),
      }));

    // Russia (643) — antimeridian split
    const interpLat = (a: number[], b: number[], targetLng: number): number => {
      let aLng = a[0], bLng = b[0];
      if (aLng > 0 && bLng < 0) bLng += 360;
      else if (aLng < 0 && bLng > 0) bLng -= 360;
      if (bLng === aLng) return a[1];
      return a[1] + ((targetLng - aLng) / (bLng - aLng)) * (b[1] - a[1]);
    };

    const splitRing = (ring: number[][]): number[][][] => {
      const crosses: { idx: number; lat: number; e2w: boolean }[] = [];
      for (let i = 1; i < ring.length; i++) {
        const diff = ring[i][0] - ring[i - 1][0];
        if (Math.abs(diff) > 180) {
          crosses.push({ idx: i, lat: interpLat(ring[i - 1], ring[i], diff < 0 ? 180 : -180), e2w: diff < 0 });
        }
      }
      if (crosses.length !== 2) return [ring];
      const [c1, c2] = crosses;
      if (c1.e2w) {
        return [
          [...ring.slice(0, c1.idx), [180, c1.lat], [180, c2.lat], ...ring.slice(c2.idx)],
          [[-180, c1.lat], ...ring.slice(c1.idx, c2.idx), [-180, c2.lat], [-180, c1.lat]],
        ];
      } else {
        return [
          [...ring.slice(0, c1.idx), [-180, c1.lat], [-180, c2.lat], ...ring.slice(c2.idx)],
          [[180, c1.lat], ...ring.slice(c1.idx, c2.idx), [180, c2.lat], [180, c1.lat]],
        ];
      }
    };

    const fixGeomAntimeridian = (geom: any): any => {
      if (!geom) return geom;
      const fixPoly = (poly: number[][][]): number[][][][] => {
        const rings = splitRing(poly[0]);
        return rings.length === 1 ? [poly] : rings.map((r) => [r]);
      };
      if (geom.type === "Polygon") {
        const polys = fixPoly(geom.coordinates);
        return polys.length === 1 ? geom : { type: "MultiPolygon", coordinates: polys };
      }
      if (geom.type === "MultiPolygon") {
        const out: number[][][][] = [];
        for (const poly of geom.coordinates) out.push(...fixPoly(poly));
        return { type: "MultiPolygon", coordinates: out };
      }
      return geom;
    };

    const russiaGeom = worldData.objects.countries.geometries.find((g: any) => Number(g.id) === 643);
    if (russiaGeom) {
      const russiaFeat = topoFeature(worldData, russiaGeom);
      features.push({
        type: "Feature",
        id: "亚洲_ru",
        properties: { name: "亚洲" },
        geometry: fixGeomAntimeridian((russiaFeat as any).geometry),
      });
    }

    registerEChartsMap("world", { type: "FeatureCollection", features } as any);
  } catch (err) {
    console.warn("Failed to load world map:", err);
  }
};

// ── ECharts 生命周期 ──

const initEChart = async () => {
  if (!echartDom.value) return;
  try {
    chartInstance = initE(echartDom.value);
    // 确保容器尺寸已生效后再初始化
    chartInstance.resize();

    chartInstance.on("click", (params: any) => {
      if (params?.data?.__cluster) {
        handleMapClusterSelect(params.data.__cluster);
      }
    });

    updateChart();
    window.addEventListener("resize", onChartResize);
  } catch (err) {
    console.warn("Failed to init chart:", err);
  }
};

const disposeEChart = () => {
  if (chartInstance) {
    chartInstance.off("click");
    chartInstance.dispose();
    chartInstance = null;
  }
  window.removeEventListener("resize", onChartResize);
};

const onChartResize = () => {
  chartInstance?.resize();
  if (chartInstance) updateChart();
};

const updateChart = () => {
  if (!chartInstance) return;

  const data = mapClusters.value.map((cluster) => ({
    value: [cluster.geoCoord[0], cluster.geoCoord[1], cluster.avgLoad],
    __cluster: cluster,
    name: cluster.regionName,
  }));

  const currentMapName = mapScope.value === "china" ? "china" : "world";
  const { boardColor, borderColor, mapFillColor, emphasisColor, isDarkBg } = getMapThemeColors();

  const geoConfig: any = {
    map: currentMapName,
    layoutCenter: ["50%", "50%"],
    label: { emphasis: { show: false } },
    itemStyle: {
      normal: { areaColor: mapFillColor, borderColor, borderWidth: 1.5 },
      emphasis: { areaColor: emphasisColor, borderColor: emphasisColor },
    },
    roam: true,
    zoom: isMobile.value ? 1.6 : 1,
    scaleLimit: { min: isMobile.value ? 1.6 : 1, max: 5 },
  };

  try {
    if (chartInstance && echartDom.value) {
      const cw = echartDom.value.clientWidth || 800;
      const ch = echartDom.value.clientHeight || 400;
      // 世界地图 2:1 用宽度约束，中国地图接近方形用较小边约束
      // 海外地图 2:1 用宽度约束，否则用较小边约束
      const base = mapScope.value === "oversea" ? cw : Math.min(cw, ch);
      const ratio = 0.92;
      geoConfig.layoutSize = Math.floor(base * ratio);
    }
  } catch { /* ignore */ }

  const option = {
    backgroundColor: "transparent",
    animation: false,
    geo: geoConfig,
    tooltip: {
      trigger: "item" as const,
      confine: true,
      formatter: (params: any) => {
        const cluster = params.data?.__cluster;
        if (!cluster) return params.name || "";
        const names = cluster.nodes
          .slice(0, 4)
          .map((node: Node) => `#${node.nodeId} ${node.name}`)
          .join("<br/>");
        const remain = cluster.nodes.length > 4 ? `<br/>… 还有 ${cluster.nodes.length - 4} 个节点` : "";
        return `${cluster.regionName}（${cluster.nodes.length}）<br/>平均负载: ${Math.round(cluster.avgLoad)}%<br/>${names}${remain}`;
      },
    },
    series: [
      {
        type: "scatter",
        coordinateSystem: "geo",
        data,
        symbolSize: (params: any) => {
          const c = params.data?.__cluster;
          const count = c?.nodes?.length || 1;
          const base = isMobile.value ? 14 : 10;
          return Math.min(isMobile.value ? 36 : 26, base + count * 2);
        },
        itemStyle: {
          color: (params: any) => {
            const c = params.data.__cluster;
            const load = c.avgLoad || 0;
            const hasSelected = !!c.nodes.find((n: Node) => n.nodeId === props.selectedNodeId);
            if (hasSelected) return "#ff8a65";
            if (load < 40) return "#4caf50";
            if (load < 60) return "#03a9f4";
            if (load < 90) return "#ffb74d";
            return "#f44336";
          },
          borderColor: isDarkBg ? mixRgbColor(boardColor, "#ffffff", 0.7) : "#fff",
          borderWidth: 2,
        },
      },
      // 用户当前位置点
      ...(userLocation.value
        ? [
            {
              type: "scatter" as const,
              coordinateSystem: "geo" as const,
              data: [{ value: userLocation.value, name: "我的位置" }],
              symbol: "pin" as const,
              symbolSize: isMobile.value ? 28 : 22,
              itemStyle: { color: "#7c4dff", borderColor: "#fff", borderWidth: 1.5 },
              tooltip: { formatter: () => "我的位置（可能不准确）" },
              zlevel: 5,
              z: 5,
            },
          ]
        : []),
    ],
  };

  chartInstance.setOption(option, { notMerge: true });
};

const ensureMapReady = async () => {
  if (props.loading) return;
  // 预加载两种地图，后续切换无需重新加载
  await Promise.all([loadChinaMap(), loadWorldMap()]);
  await nextTick();

  // 等待 DOM 就绪（Transition mode="out-in" 会延迟挂载新元素）
  for (let i = 0; i < 100; i++) {
    if (echartDom.value) break;
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }

  // 先更新容器高度，确保 ECharts 初始化时拿到正确尺寸
  updateMapHeight();
  await nextTick();

  if (!chartInstance) await initEChart();
  else {
    chartInstance.resize();
    updateChart();
  }
};

// ── 集群选择 ──

const handleMapClusterSelect = (cluster: MapCluster) => {
  if (!cluster?.nodes?.length) return;
  clusterPickerTitle.value = `选择节点 - ${cluster.regionName}`;
  clusterPickerNodes.value = cluster.nodes;
  showClusterPicker.value = true;
};

const handleClusterNodeSelect = (node: Node) => {
  showClusterPicker.value = false;
  emit("select-node", node);
};

// ── Watchers ──

watch(userLocation, async (next, prev) => {
  if (next && !prev && chartInstance) {
    chartInstance.resize();
    updateChart();
    return;
  }
  if (chartInstance) updateChart();
});

watch(mapScope, async (newScope, oldScope) => {
  if (newScope === oldScope || !chartInstance) return;
  // 加载新地图数据（如果还没注册过）
  if (newScope === "china") await loadChinaMap();
  else await loadWorldMap();
  // 刷新容器尺寸后更新图表，禁用动画避免蓝色过渡闪烁
  chartInstance.resize();
  updateChart();
});

watch(
  () => [props.nodes, props.nodeStatus, props.selectedNodeId],
  () => {
    if (chartInstance) updateChart();
  },
  { deep: true },
);

watch(
  () => themeVars.value,
  () => {
    if (chartInstance) updateChart();
  },
);

// ── ResizeObserver ──

let resizeObserver: ResizeObserver | null = null;

onMounted(async () => {
  if (!props.loading) {
    await ensureMapReady();
    // 如果之前已授权定位，自动获取位置
    if (localStorage.getItem("accept_using_geo_info")) {
      doFetchLocation();
    }
  }

  // 监听外层容器大小变化，自动调整地图尺寸
  if (worldMapRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateMapHeight();
      if (chartInstance) {
        chartInstance.resize();
        updateChart();
      }
    });
    resizeObserver.observe(worldMapRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  resizeObserver = null;
  disposeEChart();
});
</script>

<style scoped>
.node-map-wrapper {
  width: 100%;
}

.node-map-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.world-map {
  width: 100%;
  min-height: 300px;
  border: 1px solid var(--app-border-color, rgba(128, 128, 128, 0.2));
}

.world-map-layer {
  width: 100%;
  height: 100%;
  position: relative;
}

.echart-container {
  min-height: 300px;
}

/* ── 中国/海外 切换选项卡样式 ── */
.map-scope-tabs {
  margin-bottom: 8px;
  display: flex;
  justify-content: center;
}

/* 仅给 tabs 外容器加边框，内部动画保留 Naive UI 原生行为 */
.map-scope-tabs :deep(.n-tabs-nav--segment-type) {
  border: 1px solid var(--app-border-color, rgba(128, 128, 128, 0.2));
  border-radius: 6px;
}

.nodes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
</style>
