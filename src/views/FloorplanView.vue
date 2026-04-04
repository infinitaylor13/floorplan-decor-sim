<template>
  <div class="floorplanPage">
    <div class="subbar">
      <div class="actions">
        <button
          type="button"
          class="btn primary"
          @click="openFurnitureModal"
          :disabled="!imageUrl"
        >
          添加家具
        </button>
        <button type="button" class="btn" @click="resetAll" :disabled="!imageUrl">重置</button>
      </div>
    </div>

    <main class="main">
      <div class="canvasWrap">
        <div
          ref="canvasScrollRef"
          class="canvasScroll"
          @touchstart.passive="onCanvasTouchStart"
          @touchmove="onCanvasTouchMove"
          @touchend="onCanvasTouchEnd"
          @touchcancel="onCanvasTouchEnd"
        >
          <div class="canvasZoomInner" :style="canvasZoomStyle">
            <div ref="canvasRef" class="canvas">
          <img
            v-if="imageUrl"
            ref="imageRef"
            :src="imageUrl"
            class="floorImg"
            alt="户型图"
            draggable="false"
            @load="onImageLoaded"
          />

          <svg
            v-if="imageLoaded"
            ref="svgRef"
            class="overlay"
            :width="imgDisplayWpx"
            :height="imgDisplayHpx"
            :viewBox="`0 0 ${imgDisplayWpx} ${imgDisplayHpx}`"
            @pointerdown.self="onSvgPointerDownSelf"
          >
            <g
              v-for="f in furniture"
              :key="f.id"
              class="furnitureLayer"
              :opacity="selectedFurnitureId === f.id ? 1 : 0.98"
            >
              <g
                :transform="`translate(${f.xMm * pxPerMm} ${f.yMm * pxPerMm}) rotate(${f.rotation} ${f.widthMm * pxPerMm / 2} ${f.heightMm * pxPerMm / 2})`"
                @pointerdown.stop="startDragFurniture($event, f.id)"
              >
                <image
                  v-if="furnitureIconUrl[f.key]"
                  :href="furnitureIconUrl[f.key]"
                  x="0"
                  y="0"
                  :width="f.widthMm * pxPerMm"
                  :height="f.heightMm * pxPerMm"
                  preserveAspectRatio="none"
                />
                <rect
                  v-else-if="f.shape !== 'ellipse'"
                  x="0"
                  y="0"
                  :width="f.widthMm * pxPerMm"
                  :height="f.heightMm * pxPerMm"
                  :rx="rectRxPx(f)"
                  :ry="rectRxPx(f)"
                  :fill="grayFillSolid(f)"
                  :stroke="grayStrokeSolid"
                  stroke-width="2"
                />
                <ellipse
                  v-else
                  :cx="(f.widthMm * pxPerMm) / 2"
                  :cy="(f.heightMm * pxPerMm) / 2"
                  :rx="(f.widthMm * pxPerMm) / 2"
                  :ry="(f.heightMm * pxPerMm) / 2"
                  :fill="grayFillSolid(f)"
                  :stroke="grayStrokeSolid"
                  stroke-width="2"
                />
              </g>
            </g>

            <g v-if="selectedWorldBox && uiMode === 'idle'">
              <rect
                :x="selectedWorldBox.x"
                :y="selectedWorldBox.y"
                :width="selectedWorldBox.w"
                :height="selectedWorldBox.h"
                fill="none"
                stroke="rgba(0,140,255,0.9)"
                stroke-width="2"
                stroke-dasharray="8 6"
              />
              <circle
                :cx="selectedWorldBox.right.x"
                :cy="selectedWorldBox.right.y"
                r="6"
                fill="rgba(0,140,255,0.95)"
                stroke="white"
                stroke-width="1.5"
                @pointerdown.stop="startResizeRight($event)"
              />
              <circle
                :cx="selectedWorldBox.bottom.x"
                :cy="selectedWorldBox.bottom.y"
                r="6"
                fill="rgba(0,140,255,0.95)"
                stroke="white"
                stroke-width="1.5"
                @pointerdown.stop="startResizeBottom($event)"
              />
            </g>
          </svg>

          <div v-else class="canvasEmpty">上传户型图后开始。</div>
            </div>
          </div>
        </div>
      </div>

      <div class="bottomPanel card">
        <template v-if="uiMode === 'idle' && selectedFurniture">
          <div class="cardTitle">家具操作</div>
          <div class="cardBody">
            <div>尺寸：{{ selectedFurniture.widthMm }} × {{ selectedFurniture.heightMm }} mm</div>
            <div>朝向：{{ selectedFurniture.rotation }}°</div>
          </div>
          <div class="row">
            <button type="button" class="btn" @click="rotateSelected(90)">旋转 +90°</button>
            <button type="button" class="btn" @click="rotateSelected(-90)">旋转 -90°</button>
          </div>
          <div class="row">
            <button type="button" class="btn danger" @click="deleteSelectedFurniture">删除该家具</button>
          </div>
        </template>
        <div v-else class="bottomPanelPlaceholder" aria-hidden="true">&nbsp;</div>
      </div>
    </main>

    <!-- 家具选择弹层 -->
    <div v-if="furnitureModalOpen" class="modalOverlay" @click.self="closeFurnitureModal">
      <div class="modal">
        <div class="modalHeader">
          <div class="modalTitle">选择家具</div>
          <button class="iconBtn" type="button" @click="closeFurnitureModal">关闭</button>
        </div>

        <div class="modalBody">
          <div class="tabs">
            <button
              v-for="cat in furnitureCategories"
              :key="cat.key"
              type="button"
              class="tab"
              :class="{ active: selectedCategory === cat.key }"
              @click="selectedCategory = cat.key"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="items">
            <div v-for="it in filteredFurnitureItems" :key="it.key" class="itemBtnWrap">
              <button type="button" class="itemBtn" @click="chooseFurniture(it)">
                <img
                  v-if="furnitureIconUrl[it.key]"
                  class="itemIcon"
                  :src="furnitureIconUrl[it.key]"
                  alt=""
                />
                <div class="itemText">
                  <div class="itemName">{{ it.label }}</div>
                  <div class="itemSize">{{ it.wMm }} × {{ it.hMm }} mm</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div class="modalFooter">
          <div class="footHint">选择后，点击画布放置（随后可拖拽/缩放/旋转）。</div>
        </div>
      </div>
    </div>
  </div>
  <!-- end -->
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import initialFloorplan from '../assets/initial-floorplan.png'
import sofa2Top from '../assets/furniture/sofa-2-seat-top.svg'
import sofa3Top from '../assets/furniture/sofa-3-seat-top.svg'
import coffeeTableTop from '../assets/furniture/coffee-table-top.svg'
import tvConsoleTop from '../assets/furniture/tv-console-top.svg'
import diningTableTop from '../assets/furniture/dining-table-top.svg'
import sideboardTop from '../assets/furniture/sideboard-top.svg'
import bedTop from '../assets/furniture/bed-top-1.8x2.0.svg'
import wardrobeTop from '../assets/furniture/wardrobe-top.svg'
import nightstandTop from '../assets/furniture/nightstand-top.svg'
import fridgeTop from '../assets/furniture/fridge-top.svg'
import deskTop from '../assets/furniture/desk-top.svg'
import chairTop from '../assets/furniture/chair-top.svg'
import bookcaseTop from '../assets/furniture/bookcase-top.svg'
import washingMachineTop from '../assets/furniture/washing-machine-top.svg'
import cabinetTop from '../assets/furniture/cabinet-top.svg'

const furnitureIconUrl: Record<string, string> = {
  sofa_double: sofa2Top,
  sofa_three: sofa3Top,
  coffee_table: coffeeTableTop,
  tv_stand: tvConsoleTop,
  dining_table: diningTableTop,
  sideboard: sideboardTop,
  bed: bedTop,
  mattress: bedTop,
  wardrobe: wardrobeTop,
  nightstand: nightstandTop,
  fridge: fridgeTop,
  desk: deskTop,
  study_chair: chairTop,
  bookshelf: bookcaseTop,
  washing_machine: washingMachineTop,
  balcony_cabinet: cabinetTop,
}

type Rotation = 0 | 90 | 180 | 270
type PointPx = { x: number; y: number }
type PointMm = { x: number; y: number }

type FurnitureShape = 'roundedRect' | 'rect' | 'ellipse'

type FurnitureItem = {
  key: string
  label: string
  categoryKey: string
  wMm: number
  hMm: number
  shape: FurnitureShape
  color: string
}

type PlacedFurniture = {
  id: string
  key: string
  name: string
  widthMm: number
  heightMm: number
  xMm: number
  yMm: number
  rotation: Rotation
  shape: FurnitureShape
  color: string
}
const furnitureCategories = [
  { key: 'living', label: '客厅' },
  { key: 'dining', label: '餐厅' },
  { key: 'bedroom', label: '卧室' },
  { key: 'kitchen', label: '厨房' },
  { key: 'study', label: '书房' },
  { key: 'balcony', label: '阳台' },
] as const

const furnitureItems: FurnitureItem[] = [
  { key: 'sofa_double', label: '双人沙发', categoryKey: 'living', wMm: 1680, hMm: 980, shape: 'roundedRect', color: '#C892FF' },
  { key: 'sofa_three', label: '三人沙发', categoryKey: 'living', wMm: 2200, hMm: 900, shape: 'roundedRect', color: '#B980FF' },
  { key: 'coffee_table', label: '茶几', categoryKey: 'living', wMm: 1000, hMm: 600, shape: 'roundedRect', color: '#E2C1A0' },
  { key: 'tv_stand', label: '电视柜', categoryKey: 'living', wMm: 1950, hMm: 910, shape: 'rect', color: '#B9D7FF' },

  { key: 'dining_table', label: '餐桌', categoryKey: 'dining', wMm: 1600, hMm: 1000, shape: 'roundedRect', color: '#C9B299' },
  { key: 'sideboard', label: '餐边柜', categoryKey: 'dining', wMm: 1820, hMm: 980, shape: 'rect', color: '#BBD7B0' },

  { key: 'bed', label: '床', categoryKey: 'bedroom', wMm: 1800, hMm: 2000, shape: 'roundedRect', color: '#9FD3FF' },
  { key: 'mattress', label: '床垫', categoryKey: 'bedroom', wMm: 1800, hMm: 2000, shape: 'roundedRect', color: '#B7E3FF' },
  { key: 'wardrobe', label: '衣柜', categoryKey: 'bedroom', wMm: 1800, hMm: 1260, shape: 'rect', color: '#CFE1FF' },
  { key: 'nightstand', label: '床头柜', categoryKey: 'bedroom', wMm: 560, hMm: 560, shape: 'rect', color: '#CBB5A2' },

  { key: 'fridge', label: '冰箱', categoryKey: 'kitchen', wMm: 750, hMm: 500, shape: 'rect', color: '#A3E8D2' },

  { key: 'desk', label: '书桌', categoryKey: 'study', wMm: 1400, hMm: 800, shape: 'rect', color: '#FFD7A3' },
  { key: 'study_chair', label: '椅子', categoryKey: 'study', wMm: 520, hMm: 520, shape: 'roundedRect', color: '#FFE3C2' },
  { key: 'bookshelf', label: '书柜', categoryKey: 'study', wMm: 1300, hMm: 910, shape: 'rect', color: '#C7B6FF' },

  { key: 'washing_machine', label: '洗衣机', categoryKey: 'balcony', wMm: 620, hMm: 620, shape: 'roundedRect', color: '#B8F3FF' },
  { key: 'balcony_cabinet', label: '橱柜', categoryKey: 'balcony', wMm: 1920, hMm: 840, shape: 'rect', color: '#CBE8D9' },
] as const

const selectedCategory = ref<string>('living')

const uid = () => {
  // 兼容：部分旧环境可能没有 crypto.randomUUID()
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

const hashStr = (s: string) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const grayFillSolid = (f: PlacedFurniture) => {
  // 纯灰度，不透明（避免“太花”）
  const base = 170 + (hashStr(f.key) % 50) // 170-219
  return `rgb(${base},${base},${base})`
}

const grayStrokeSolid = 'rgb(70,70,70)'

const rectRxPx = (f: PlacedFurniture) => {
  const ppm = pxPerMmValue.value
  const w = f.widthMm * ppm
  const h = f.heightMm * ppm
  const m = Math.min(w, h)
  if (f.shape === 'roundedRect') return Math.max(6, Math.min(14, m * 0.14))
  return Math.max(4, Math.min(10, m * 0.10))
}

const filteredFurnitureItems = computed(() => {
  return furnitureItems.filter((it) => it.categoryKey === selectedCategory.value)
})

const imageUrl = ref<string | null>(initialFloorplan)
const imageLoaded = ref(false)
const imgDisplayWpx = ref(0)
const imgDisplayHpx = ref(0)

const imageRef = ref<HTMLImageElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)
const canvasRef = ref<HTMLDivElement | null>(null)
const FLOORPLAN_REAL_WIDTH_MM = 12600
const FLOORPLAN_REAL_HEIGHT_MM = 17700

const pxPerMm = computed(() => {
  return pxPerMmValue.value
})

const pxPerMmValue = ref<number>(1)

/** 画布视图缩放（双指捏合/移动）；最小为 1，不再缩小到比初始铺满画布更小 */
const VIEW_SCALE_MIN = 1
const VIEW_SCALE_MAX = 5
const canvasScrollRef = ref<HTMLDivElement | null>(null)
const viewScale = ref(1)
const viewPanX = ref(0)
const viewPanY = ref(0)

const canvasZoomStyle = computed(() => ({
  transform: `translate(${viewPanX.value}px, ${viewPanY.value}px) scale(${viewScale.value})`,
  transformOrigin: '0 0' as const,
}))

/** scale 为 1 时不允许平移，始终居中 */
watch(viewScale, (s) => {
  if (s < VIEW_SCALE_MIN - 1e-6) {
    viewScale.value = VIEW_SCALE_MIN
    return
  }
  if (s <= VIEW_SCALE_MIN + 1e-6) {
    viewPanX.value = 0
    viewPanY.value = 0
  }
})

let pinchStartDist = 0
let pinchLastMidX = 0
let pinchLastMidY = 0

const touchDistance = (a: Touch, b: Touch) => {
  const dx = a.clientX - b.clientX
  const dy = a.clientY - b.clientY
  return Math.hypot(dx, dy)
}

const onCanvasTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 2) {
    const t0 = e.touches[0]
    const t1 = e.touches[1]
    pinchStartDist = touchDistance(t0, t1)
    const el = canvasScrollRef.value
    if (!el) return
    const r = el.getBoundingClientRect()
    pinchLastMidX = (t0.clientX + t1.clientX) / 2 - r.left
    pinchLastMidY = (t0.clientY + t1.clientY) / 2 - r.top
  }
}

const onCanvasTouchMove = (e: TouchEvent) => {
  if (e.touches.length !== 2) return
  e.preventDefault()
  const t0 = e.touches[0]
  const t1 = e.touches[1]
  const el = canvasScrollRef.value
  if (!el || pinchStartDist <= 0) return
  const r = el.getBoundingClientRect()
  const midX = (t0.clientX + t1.clientX) / 2 - r.left
  const midY = (t0.clientY + t1.clientY) / 2 - r.top
  const dist = touchDistance(t0, t1)

  const s0 = viewScale.value
  const ratio = dist / pinchStartDist
  let s1 = s0 * ratio
  if (s1 < VIEW_SCALE_MIN) s1 = VIEW_SCALE_MIN
  if (s1 > VIEW_SCALE_MAX) s1 = VIEW_SCALE_MAX

  if (s0 <= VIEW_SCALE_MIN + 1e-6) {
    viewPanX.value = 0
    viewPanY.value = 0
    if (s1 <= VIEW_SCALE_MIN + 1e-6) {
      viewScale.value = VIEW_SCALE_MIN
    } else {
      const wx = midX / s0
      const wy = midY / s0
      viewScale.value = s1
      viewPanX.value = midX - wx * s1
      viewPanY.value = midY - wy * s1
    }
  } else {
    viewPanX.value += midX - pinchLastMidX
    viewPanY.value += midY - pinchLastMidY
    const wx = (midX - viewPanX.value) / s0
    const wy = (midY - viewPanY.value) / s0
    viewScale.value = s1
    viewPanX.value = midX - wx * s1
    viewPanY.value = midY - wy * s1
    if (viewScale.value <= VIEW_SCALE_MIN + 1e-6) {
      viewScale.value = VIEW_SCALE_MIN
      viewPanX.value = 0
      viewPanY.value = 0
    }
  }

  pinchStartDist = dist
  pinchLastMidX = midX
  pinchLastMidY = midY
}

const onCanvasTouchEnd = (e: TouchEvent) => {
  if (e.touches.length < 2) {
    pinchStartDist = 0
    if (viewScale.value <= VIEW_SCALE_MIN + 1e-6) {
      viewScale.value = VIEW_SCALE_MIN
      viewPanX.value = 0
      viewPanY.value = 0
    }
  }
}

const scaleReady = computed(() => pxPerMmValue.value > 0)

type UiMode = 'idle' | 'placeFurniture'
const uiMode = ref<UiMode>('idle')

const furniture = reactive<PlacedFurniture[]>([])
const selectedFurnitureId = ref<string | null>(null)

const selectedFurniture = computed(() => {
  if (!selectedFurnitureId.value) return null
  return furniture.find((f) => f.id === selectedFurnitureId.value) ?? null
})

const selectedWorldBox = computed(() => {
  if (!selectedFurniture.value || !scaleReady.value) return null
  const f = selectedFurniture.value
  const wPx = f.widthMm * pxPerMmValue.value
  const hPx = f.heightMm * pxPerMmValue.value
  const angle = f.rotation % 180
  const worldW = angle === 0 ? wPx : hPx
  const worldH = angle === 0 ? hPx : wPx
  const cx = (f.xMm + f.widthMm / 2) * pxPerMmValue.value
  const cy = (f.yMm + f.heightMm / 2) * pxPerMmValue.value
  const x = cx - worldW / 2
  const y = cy - worldH / 2
  return {
    x,
    y,
    w: worldW,
    h: worldH,
    right: { x: x + worldW, y: y + worldH / 2 },
    bottom: { x: x + worldW / 2, y: y + worldH },
  }
})

const resetAll = () => {
  imageUrl.value = initialFloorplan
  imageLoaded.value = false
  imgDisplayWpx.value = 0
  imgDisplayHpx.value = 0
  pxPerMmValue.value = 1
  viewScale.value = 1
  viewPanX.value = 0
  viewPanY.value = 0
  pinchStartDist = 0
  uiMode.value = 'idle'
  furniture.splice(0, furniture.length)
  selectedFurnitureId.value = null
  furnitureModalOpen.value = false
}

const onImageLoaded = () => {
  if (!imageRef.value) return
  imgDisplayWpx.value = imageRef.value.clientWidth
  imgDisplayHpx.value = imageRef.value.clientHeight
  const ppmX = imgDisplayWpx.value / FLOORPLAN_REAL_WIDTH_MM
  const ppmY = imgDisplayHpx.value / FLOORPLAN_REAL_HEIGHT_MM
  // 取 x/y 两个方向的平均，保证使用统一比例尺。
  const ppm = (ppmX + ppmY) / 2
  pxPerMmValue.value = Number.isFinite(ppm) && ppm > 0 ? ppm : 1
  imageLoaded.value = imgDisplayWpx.value > 0 && imgDisplayHpx.value > 0
}

const getSvgPointPx = (e: PointerEvent): PointPx => {
  const scroll = canvasScrollRef.value
  if (!scroll) return { x: 0, y: 0 }
  const rect = scroll.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const vs = viewScale.value
  return {
    x: (x - viewPanX.value) / vs,
    y: (y - viewPanY.value) / vs,
  }
}

const furnitureModalOpen = ref(false)
const pendingFurnitureRef = ref<FurnitureItem | null>(null)

const openFurnitureModal = () => {
  furnitureModalOpen.value = true
}
const closeFurnitureModal = () => {
  furnitureModalOpen.value = false
}

const chooseFurniture = (it: FurnitureItem) => {
  pendingFurnitureRef.value = it
  closeFurnitureModal()
  uiMode.value = 'placeFurniture'
}

const startDragFurniture = (_e: PointerEvent, furnitureId: string) => {
  if (uiMode.value !== 'idle') return
  selectedFurnitureId.value = furnitureId
  const f = furniture.find((x) => x.id === furnitureId)
  if (!f) return

  const pointerStart = { x: _e.clientX, y: _e.clientY }
  const startX = f.xMm
  const startY = f.yMm

  activeInteraction.value = {
    type: 'dragFurniture',
    id: furnitureId,
    pointerStart,
    startX,
    startY,
  }
}

const rotateSelected = (delta: 90 | -90) => {
  const f = selectedFurniture.value
  if (!f) return
  const steps = ((delta / 90) as number) % 4
  const idx = ((f.rotation / 90) + steps + 4) % 4
  f.rotation = (idx * 90) as Rotation
}

const deleteSelectedFurniture = () => {
  if (!selectedFurnitureId.value) return
  const idx = furniture.findIndex((x) => x.id === selectedFurnitureId.value)
  if (idx >= 0) furniture.splice(idx, 1)
  selectedFurnitureId.value = null
}

type ActiveInteraction =
  | null
  | {
      type: 'dragFurniture'
      id: string
      pointerStart: { x: number; y: number }
      startX: number
      startY: number
    }
  | {
      type: 'resizeRight' | 'resizeBottom'
      id: string
      pointerStart: { x: number; y: number }
      startCenter: PointMm
      startWidthMm: number
      startHeightMm: number
      startRotation: Rotation
      startWorldWpx: number
      startWorldHpx: number
    }

const activeInteraction = ref<ActiveInteraction>(null)

const onPointerMove = (e: PointerEvent) => {
  if (!activeInteraction.value) return

  if (activeInteraction.value.type === 'dragFurniture') {
    const cur = furniture.find((x) => x.id === activeInteraction.value!.id)
    if (!cur) return
    const vs = viewScale.value
    const dxPx = (e.clientX - activeInteraction.value.pointerStart.x) / vs
    const dyPx = (e.clientY - activeInteraction.value.pointerStart.y) / vs
    const dxMm = dxPx / pxPerMmValue.value
    const dyMm = dyPx / pxPerMmValue.value
    cur.xMm = activeInteraction.value.startX + dxMm
    cur.yMm = activeInteraction.value.startY + dyMm
  }

  if (activeInteraction.value.type === 'resizeRight') {
    const cur = furniture.find((x) => x.id === activeInteraction.value!.id)
    if (!cur) return
    const vs = viewScale.value
    const dx = (e.clientX - activeInteraction.value.pointerStart.x) / vs
    const angleEven = cur.rotation % 180 === 0
    const newWorldW = Math.max(50, activeInteraction.value.startWorldWpx + dx)
    const center = activeInteraction.value.startCenter
    if (angleEven) {
      const newW = Math.max(1, Math.round(newWorldW / pxPerMmValue.value))
      cur.widthMm = newW
      cur.heightMm = activeInteraction.value.startHeightMm
      cur.xMm = center.x - newW / 2
      cur.yMm = center.y - cur.heightMm / 2
    } else {
      const newH = Math.max(1, Math.round(newWorldW / pxPerMmValue.value))
      cur.heightMm = newH
      cur.widthMm = activeInteraction.value.startWidthMm
      cur.xMm = center.x - cur.widthMm / 2
      cur.yMm = center.y - newH / 2
    }
  }

  if (activeInteraction.value.type === 'resizeBottom') {
    const cur = furniture.find((x) => x.id === activeInteraction.value!.id)
    if (!cur) return
    const vs = viewScale.value
    const dy = (e.clientY - activeInteraction.value.pointerStart.y) / vs
    const angleEven = cur.rotation % 180 === 0
    const newWorldH = Math.max(50, activeInteraction.value.startWorldHpx + dy)
    const center = activeInteraction.value.startCenter
    if (angleEven) {
      const newH = Math.max(1, Math.round(newWorldH / pxPerMmValue.value))
      cur.heightMm = newH
      cur.widthMm = activeInteraction.value.startWidthMm
      cur.xMm = center.x - cur.widthMm / 2
      cur.yMm = center.y - newH / 2
    } else {
      const newW = Math.max(1, Math.round(newWorldH / pxPerMmValue.value))
      cur.widthMm = newW
      cur.heightMm = activeInteraction.value.startHeightMm
      cur.xMm = center.x - newW / 2
      cur.yMm = center.y - cur.heightMm / 2
    }
  }

}

const snapFurnitureMm = (f: PlacedFurniture) => {
  f.widthMm = Math.max(1, Math.round(f.widthMm))
  f.heightMm = Math.max(1, Math.round(f.heightMm))
}

const endInteraction = () => {
  if (!activeInteraction.value) return
  const t = activeInteraction.value.type
  if (t === 'resizeRight' || t === 'resizeBottom') {
    const cur = furniture.find((x) => x.id === activeInteraction.value!.id)
    if (cur) snapFurnitureMm(cur)
  }
  activeInteraction.value = null
}

const startResizeRight = (e: PointerEvent) => {
  if (uiMode.value !== 'idle') return
  const f = selectedFurniture.value
  if (!f) return
  selectedFurnitureId.value = f.id
  if (!selectedWorldBox.value) return
  const worldBox = selectedWorldBox.value
  const center: PointMm = { x: f.xMm + f.widthMm / 2, y: f.yMm + f.heightMm / 2 }

  activeInteraction.value = {
    type: 'resizeRight',
    id: f.id,
    pointerStart: { x: e.clientX, y: e.clientY },
    startCenter: center,
    startWidthMm: f.widthMm,
    startHeightMm: f.heightMm,
    startRotation: f.rotation,
    startWorldWpx: worldBox.w,
    startWorldHpx: worldBox.h,
  }
}

const startResizeBottom = (e: PointerEvent) => {
  if (uiMode.value !== 'idle') return
  const f = selectedFurniture.value
  if (!f) return
  selectedFurnitureId.value = f.id
  if (!selectedWorldBox.value) return
  const worldBox = selectedWorldBox.value
  const center: PointMm = { x: f.xMm + f.widthMm / 2, y: f.yMm + f.heightMm / 2 }

  activeInteraction.value = {
    type: 'resizeBottom',
    id: f.id,
    pointerStart: { x: e.clientX, y: e.clientY },
    startCenter: center,
    startWidthMm: f.widthMm,
    startHeightMm: f.heightMm,
    startRotation: f.rotation,
    startWorldWpx: worldBox.w,
    startWorldHpx: worldBox.h,
  }
}

const onSvgPointerDownSelf = (e: PointerEvent) => {
  if (!imageLoaded.value) return

  if (uiMode.value === 'placeFurniture') {
    if (!pendingFurnitureRef.value) {
      return
    }
    const it = pendingFurnitureRef.value
    const p = getSvgPointPx(e)
    const centerMm: PointMm = { x: p.x / pxPerMmValue.value, y: p.y / pxPerMmValue.value }

    const wMm = Math.round(it.wMm)
    const hMm = Math.round(it.hMm)
    const newF: PlacedFurniture = {
      id: uid(),
      key: it.key,
      name: it.label,
      widthMm: wMm,
      heightMm: hMm,
      xMm: centerMm.x - wMm / 2,
      yMm: centerMm.y - hMm / 2,
      rotation: 0,
      shape: it.shape,
      color: it.color,
    }
    furniture.push(newF)
    selectedFurnitureId.value = newF.id
    uiMode.value = 'idle'
    pendingFurnitureRef.value = null
    return
  }

  // idle：背景点击清空选择
  if (uiMode.value === 'idle') {
    selectedFurnitureId.value = null
  }
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', endInteraction)
  window.removeEventListener('pointercancel', endInteraction)
})

// 全局指针移动：只要在拖拽/缩放/框选状态，就更新。
onMounted(() => {
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', endInteraction)
  window.addEventListener('pointercancel', endInteraction)
})
</script>

<style scoped>
.floorplanPage {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
  color: #111827;
}

.subbar {
  position: sticky;
  top: 0;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 8px 12px;
  background: rgba(246, 247, 251, 0.95);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.btn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  color: #111827;
  padding: 8px 10px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
}
.btn.primary {
  border-color: rgba(0, 140, 255, 0.2);
  background: rgba(0, 140, 255, 0.12);
  color: #0070f3;
}
.btn.danger {
  border-color: rgba(255, 0, 80, 0.25);
  background: rgba(255, 0, 80, 0.08);
  color: #d50032;
}
.btn:disabled {
  opacity: 0.5;
}

.main {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 12px 18px;
}

.bottomPanel {
  flex-shrink: 0;
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.bottomPanelPlaceholder {
  flex: 1;
  min-height: 1em;
  color: transparent;
  user-select: none;
  pointer-events: none;
}

.card {
  margin-top: 0;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 10px;
  background: #fbfbfe;
}
.cardTitle {
  font-weight: 800;
  margin-bottom: 8px;
}
.cardBody {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  line-height: 1.5;
}
.row {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 10px;
}
.label {
  font-size: 13px;
  color: rgba(0, 0, 0, 0.7);
  min-width: 90px;
}
.input {
  flex: 1;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 8px 10px;
  /* iOS Safari: 输入框字体太小会在聚焦时自动缩放 */
  font-size: 16px;
  background: #fff;
}

.canvasWrap {
  position: relative;
  flex: 1;
  min-height: 0;
}

.canvasScroll {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  touch-action: none;
}

.canvasZoomInner {
  display: inline-block;
  vertical-align: top;
  will-change: transform;
}

.canvas {
  position: relative;
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.floorImg {
  width: 100%;
  height: auto;
  display: block;
  user-select: none;
}

.overlay {
  position: absolute;
  inset: 0;
  touch-action: none;
}

.canvasEmpty {
  padding: 30px 0;
  text-align: center;
  color: rgba(0, 0, 0, 0.6);
}

.modalOverlay {
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal {
  width: 100%;
  max-width: 520px;
  max-height: 82svh;
  background: white;
  border-radius: 18px 18px 0 0;
  overflow: hidden;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.2);
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.modalTitle {
  font-weight: 900;
}
.iconBtn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  font-weight: 700;
}

.modalBody {
  padding: 12px 14px 10px;
  overflow: auto;
}

.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tab {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #fff;
  border-radius: 999px;
  padding: 8px 10px;
  font-weight: 800;
  font-size: 13px;
  color: rgba(0, 0, 0, 0.75);
}
.tab.active {
  border-color: rgba(0, 140, 255, 0.35);
  background: rgba(0, 140, 255, 0.12);
  color: #0070f3;
}

.items {
  margin-top: 12px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.itemBtnWrap {
  display: flex;
}
.itemBtn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: #fafafa;
  border-radius: 14px;
  padding: 10px 10px;
}
.itemIcon {
  width: 56px;
  height: 56px;
  object-fit: contain;
  flex-shrink: 0;
}
.itemText {
  min-width: 0;
  flex: 1;
}
.itemBtn:active {
  transform: scale(0.99);
}
.itemName {
  font-weight: 900;
  font-size: 13px;
}
.itemSize {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.modalFooter {
  padding: 10px 14px 14px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}
.footHint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.65);
  line-height: 1.4;
}

@media (min-width: 900px) {
  .main {
    flex-direction: column;
  }
}
</style>

