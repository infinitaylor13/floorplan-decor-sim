<template>
  <div class="budgetPage">
    <div
      v-if="confirmOpen"
      class="confirmOverlay"
      @click.self="closeConfirm"
      role="dialog"
      aria-modal="true"
    >
      <div class="confirmModal">
        <div class="confirmTitle">确认删除</div>
        <div class="confirmText">{{ confirmText }}</div>
        <div class="confirmActions">
          <button type="button" class="btn" @click="closeConfirm">取消</button>
          <button type="button" class="btn danger" @click="confirmDelete">确认删除</button>
        </div>
      </div>
    </div>

    <section class="totalStrip card" aria-live="polite">
      <div class="totalLabel">已选产品总价</div>
      <div class="totalValue">¥ {{ formatMoney(totalYuan) }}</div>
    </section>

    <div class="toolbar">
      <button type="button" class="btn primary" @click="addFurnitureLine">添加家具</button>
    </div>

    <section
      v-for="line in lines"
      :key="line.id"
      class="card lineCard"
    >
      <button
        type="button"
        class="iconBtn lineDeleteBtn"
        aria-label="删除此家具"
        title="删除此家具"
        @click="requestDeleteFurnitureLine(line.id)"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M9 3h6m-8 4h10m-1 0-1 14H9L8 7"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>

      <div class="lineHead">
        <label class="fieldLabel">
          <span>家具名称</span>
          <input
            v-model="line.name"
            type="text"
            class="input"
            placeholder="例如：客厅沙发"
            autocomplete="off"
          />
        </label>
      </div>

      <div class="altSection">
        <div class="altTitleRow">
          <span class="altTitle">备选产品（行：每个产品一行）</span>
          <div class="altTitleActions">
            <button type="button" class="btn small" @click="addCustomAttrRow(line)">
              添加属性
            </button>
            <button
              v-if="line.alternatives.length === 0"
              type="button"
              class="btn small"
              @click="addAlternative(line.id)"
            >
              添加产品
            </button>
          </div>
        </div>

        <p v-if="line.alternatives.length === 0" class="hint">暂无产品，请点击「添加产品」。</p>

        <div v-else class="compareWrap">
          <table
            class="compareTable"
            :aria-label="`「${line.name || '未命名家具'}」备选对比`"
          >
            <colgroup>
              <col class="colWAction" />
              <col class="colWProduct" />
              <col class="colWPrice" />
              <col
                v-for="row in line.customAttrRows"
                :key="'cw-' + row.id"
                class="colWCustom"
              />
              <col class="colWLink" />
            </colgroup>
            <thead>
              <tr>
                <th class="stickyCornerHead" scope="col">操作</th>
                <th class="colHead colHeadProduct stickyProductHead" scope="col">产品名</th>
                <th class="colHead colHeadPrice" scope="col">价格（元）</th>
                <th
                  v-for="row in line.customAttrRows"
                  :key="row.id"
                  class="colHead colHeadCustom"
                  scope="col"
                >
                  <div class="customColHeadInner">
                    <input
                      v-model="row.label"
                      type="text"
                      class="input inputColTitle"
                      placeholder="属性名称"
                      aria-label="自定义列标题"
                    />
                    <button
                      type="button"
                      class="iconBtn attrColDeleteBtn"
                      aria-label="删除该自定义列"
                      title="删除该自定义列"
                      @click="requestDeleteCustomAttrColumn(line.id, row.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M9 3h6m-8 4h10m-1 0-1 14H9L8 7"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
                <th class="colHead colHeadLink" scope="col">链接</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="alt in line.alternatives" :key="alt.id">
                <th class="stickyCornerBody" scope="row">
                  <div class="rowActionInner">
                    <input
                      type="checkbox"
                      class="budgetCheck"
                      aria-label="计入预算"
                      title="计入预算"
                      :checked="line.selectedIds.includes(alt.id)"
                      @change="
                        onAltCheck(line, alt.id, ($event.target as HTMLInputElement).checked)
                      "
                    />
                    <button
                      type="button"
                      class="iconBtn colDeleteBtn"
                      aria-label="删除该产品"
                      title="删除该产品"
                      @click="requestDeleteAlternative(line.id, alt.id)"
                    >
                      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path
                          d="M9 3h6m-8 4h10m-1 0-1 14H9L8 7"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
                <td class="bodyCell bodyCellProduct stickyProductBody">
                  <input
                    v-model="alt.productName"
                    type="text"
                    class="input inputProduct"
                    placeholder="产品名"
                    autocomplete="off"
                  />
                </td>
                <td class="bodyCell bodyCellPrice">
                  <input
                    :value="alt.price === null || alt.price === undefined ? '' : alt.price"
                    type="number"
                    min="0"
                    step="0.01"
                    class="input inputPrice"
                    placeholder="选填"
                    @input="onPriceInput(alt, $event)"
                  />
                </td>
                <td
                  v-for="row in line.customAttrRows"
                  :key="`${alt.id}-${row.id}`"
                  class="bodyCell bodyCellCustom"
                >
                  <input
                    :value="customCell(alt, row.id)"
                    type="text"
                    class="input inputCustom"
                    placeholder="选填"
                    @input="setCustomCell(alt, row.id, ($event.target as HTMLInputElement).value)"
                  />
                </td>
                <td class="bodyCell bodyCellLink">
                  <div class="inlineField">
                    <input
                      v-model="alt.link"
                      type="url"
                      class="input inputLink inlineGrow"
                      placeholder="https://… 选填"
                    />
                    <a
                      v-if="normalizedLink(alt.link)"
                      class="extLink inlineSuffix"
                      :href="normalizedLink(alt.link)!"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      打开
                    </a>
                  </div>
                </td>
              </tr>
              <tr class="addAttrRow">
                <td
                  class="addAttrCell"
                  :colspan="4 + line.customAttrRows.length"
                >
                  <button type="button" class="btn small" @click="addAlternative(line.id)">
                    添加产品
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <p v-if="lines.length === 0" class="emptyHint">点击「添加家具」开始编制预算方案。</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

const STORAGE_KEY = 'floorplan-budget-calculator-v1'

type CustomAttrRow = {
  id: string
  label: string
}

type BudgetProduct = {
  id: string
  productName: string
  link: string
  price: number | null
  customValues: Record<string, string>
}

type BudgetLine = {
  id: string
  name: string
  alternatives: BudgetProduct[]
  /** 勾选的备选产品 id，可多选或为空 */
  selectedIds: string[]
  /** 自定义属性列（表头可编辑，每行产品一个单元格） */
  customAttrRows: CustomAttrRow[]
}

const uid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

const lines = ref<BudgetLine[]>([])

const confirmOpen = ref(false)
const confirmKind = ref<'line' | 'alt' | 'customCol' | null>(null)
const confirmLineId = ref('')
const confirmAltId = ref('')
const confirmCustomAttrRowId = ref('')

const closeConfirm = () => {
  confirmOpen.value = false
  confirmKind.value = null
  confirmLineId.value = ''
  confirmAltId.value = ''
  confirmCustomAttrRowId.value = ''
}

const requestDeleteFurnitureLine = (lineId: string) => {
  confirmOpen.value = true
  confirmKind.value = 'line'
  confirmLineId.value = lineId
  confirmAltId.value = ''
  confirmCustomAttrRowId.value = ''
}

const requestDeleteAlternative = (lineId: string, altId: string) => {
  confirmOpen.value = true
  confirmKind.value = 'alt'
  confirmLineId.value = lineId
  confirmAltId.value = altId
  confirmCustomAttrRowId.value = ''
}

const requestDeleteCustomAttrColumn = (lineId: string, rowId: string) => {
  confirmOpen.value = true
  confirmKind.value = 'customCol'
  confirmLineId.value = lineId
  confirmAltId.value = ''
  confirmCustomAttrRowId.value = rowId
}

const confirmText = computed(() => {
  if (!confirmKind.value) return ''
  if (confirmKind.value === 'line') {
    return '确定删除这条家具方案吗？该家具下的备选与勾选也会一并删除。'
  }
  if (confirmKind.value === 'alt') {
    return '确定删除这个备选产品吗？如果它被勾选了，也会从预算里移除。'
  }
  const line = lines.value.find((l) => l.id === confirmLineId.value)
  const row = line?.customAttrRows.find((r) => r.id === confirmCustomAttrRowId.value)
  const name = row?.label?.trim() || '该自定义属性'
  return `确定删除自定义列「${name}」吗？所有产品在这一列里填写的内容都会丢失。`
})

const totalYuan = computed(() => {
  let sum = 0
  for (const line of lines.value) {
    const set = new Set(line.selectedIds)
    for (const alt of line.alternatives) {
      if (!set.has(alt.id)) continue
      const p = alt.price
      if (p != null && Number.isFinite(p) && p >= 0) sum += p
    }
  }
  return sum
})

const formatMoney = (n: number) =>
  n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizedLink = (raw: string): string | null => {
  const t = raw.trim()
  if (!t) return null
  if (/^https?:\/\//i.test(t)) return t
  if (/^\/\//.test(t)) return `https:${t}`
  return `https://${t}`
}

const customCell = (alt: BudgetProduct, rowId: string) => alt.customValues[rowId] ?? ''

const setCustomCell = (alt: BudgetProduct, rowId: string, value: string) => {
  alt.customValues = { ...alt.customValues, [rowId]: value }
}

const onPriceInput = (alt: BudgetProduct, e: Event) => {
  const v = (e.target as HTMLInputElement).value.trim()
  if (v === '') {
    alt.price = null
    return
  }
  const n = Number(v)
  alt.price = Number.isFinite(n) ? n : null
}

const addFurnitureLine = () => {
  lines.value.push({
    id: uid(),
    name: '',
    alternatives: [],
    selectedIds: [],
    customAttrRows: [],
  })
}

const removeFurnitureLine = (lineId: string) => {
  lines.value = lines.value.filter((l) => l.id !== lineId)
}

const emptyCustomValuesForLine = (line: BudgetLine): Record<string, string> => {
  const o: Record<string, string> = {}
  for (const r of line.customAttrRows) o[r.id] = ''
  return o
}

const addAlternative = (lineId: string) => {
  const line = lines.value.find((l) => l.id === lineId)
  if (!line) return
  const isFirst = line.alternatives.length === 0
  const newAlt: BudgetProduct = {
    id: uid(),
    productName: '',
    link: '',
    price: null,
    customValues: emptyCustomValuesForLine(line),
  }
  line.alternatives.push(newAlt)
  if (isFirst) {
    line.selectedIds = [newAlt.id]
  }
}

const removeAlternative = (lineId: string, altId: string) => {
  const line = lines.value.find((l) => l.id === lineId)
  if (!line) return
  line.alternatives = line.alternatives.filter((a) => a.id !== altId)
  line.selectedIds = line.selectedIds.filter((id) => id !== altId)
}

const addCustomAttrRow = (line: BudgetLine) => {
  const rowId = uid()
  line.customAttrRows.push({ id: rowId, label: '新属性' })
  for (const alt of line.alternatives) {
    alt.customValues = { ...alt.customValues, [rowId]: '' }
  }
}

const removeCustomAttrRow = (line: BudgetLine, rowId: string) => {
  line.customAttrRows = line.customAttrRows.filter((r) => r.id !== rowId)
  for (const alt of line.alternatives) {
    const next = { ...alt.customValues }
    delete next[rowId]
    alt.customValues = next
  }
}

const confirmDelete = () => {
  if (!confirmKind.value) return
  if (confirmKind.value === 'line') {
    removeFurnitureLine(confirmLineId.value)
  } else if (confirmKind.value === 'alt') {
    removeAlternative(confirmLineId.value, confirmAltId.value)
  } else if (confirmKind.value === 'customCol') {
    const line = lines.value.find((l) => l.id === confirmLineId.value)
    if (line) removeCustomAttrRow(line, confirmCustomAttrRowId.value)
  }
  closeConfirm()
}

const onAltCheck = (line: BudgetLine, altId: string, checked: boolean) => {
  const set = new Set(line.selectedIds)
  if (checked) set.add(altId)
  else set.delete(altId)
  line.selectedIds = Array.from(set)
}

function parseBudgetProduct(o: Record<string, unknown>): BudgetProduct | null {
  let price: number | null = null
  if (typeof o.price === 'number' && Number.isFinite(o.price)) price = o.price
  else if (o.price === null || o.price === undefined) price = null

  const legacyBrand = typeof o.brand === 'string' ? o.brand : ''
  const legacyModel = typeof o.model === 'string' ? o.model : ''
  const legacyName = [legacyBrand, legacyModel].filter(Boolean).join(' ').trim()
  const productName =
    typeof o.productName === 'string'
      ? o.productName
      : legacyName

  let customValues: Record<string, string> = {}
  if (o.customValues && typeof o.customValues === 'object' && !Array.isArray(o.customValues)) {
    for (const [k, v] of Object.entries(o.customValues as Record<string, unknown>)) {
      if (typeof v === 'string') customValues[k] = v
    }
  }

  return {
    id: typeof o.id === 'string' ? o.id : uid(),
    productName,
    link: typeof o.link === 'string' ? o.link : '',
    price,
    customValues,
  }
}

const loadFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const data = JSON.parse(raw) as unknown
    if (!data || typeof data !== 'object') return
    const arr = (data as { lines?: unknown }).lines
    if (!Array.isArray(arr)) return
    const parsed: BudgetLine[] = []
    for (const row of arr) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : uid()
      const name = typeof r.name === 'string' ? r.name : ''
      const selectedIds = Array.isArray(r.selectedIds)
        ? r.selectedIds.filter((x): x is string => typeof x === 'string')
        : []
      const altsIn = Array.isArray(r.alternatives) ? r.alternatives : []
      const alternatives: BudgetProduct[] = []
      for (const a of altsIn) {
        if (!a || typeof a !== 'object') continue
        const p = parseBudgetProduct(a as Record<string, unknown>)
        if (p) alternatives.push(p)
      }

      let customAttrRows: CustomAttrRow[] = []
      if (Array.isArray(r.customAttrRows)) {
        for (const c of r.customAttrRows) {
          if (!c || typeof c !== 'object') continue
          const cr = c as Record<string, unknown>
          if (typeof cr.id !== 'string' || typeof cr.label !== 'string') continue
          customAttrRows.push({ id: cr.id, label: cr.label })
        }
      }

      const legacyNotes = alternatives.map((alt, i) => {
        const o = altsIn[i] as Record<string, unknown>
        return typeof o?.note === 'string' ? o.note.trim() : ''
      })
      const anyNote = legacyNotes.some((n) => n.length > 0)

      if (customAttrRows.length === 0 && anyNote) {
        const noteRowId = uid()
        customAttrRows = [{ id: noteRowId, label: '备注' }]
        alternatives.forEach((alt, i) => {
          alt.customValues = { ...alt.customValues, [noteRowId]: legacyNotes[i] ?? '' }
        })
      }

      for (const alt of alternatives) {
        for (const cr of customAttrRows) {
          if (alt.customValues[cr.id] === undefined) alt.customValues[cr.id] = ''
        }
      }

      parsed.push({ id, name, alternatives, selectedIds, customAttrRows })
    }
    lines.value = parsed
  } catch {
    /* ignore */
  }
}

const saveToStorage = () => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        lines: lines.value,
      }),
    )
  } catch {
    /* quota etc. */
  }
}

onMounted(() => {
  loadFromStorage()
})

watch(
  lines,
  () => {
    saveToStorage()
  },
  { deep: true },
)
</script>

<style scoped>
.budgetPage {
  flex: 1;
  min-height: 0;
  padding: 10px 12px 28px;
  max-width: min(100%, 1600px);
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.card {
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 12px 14px;
  background: #fbfbfe;
}

.totalStrip {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  position: sticky;
  top: 52px;
  z-index: 3;
  margin-bottom: 12px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06);
}

.totalLabel {
  font-weight: 800;
  font-size: 14px;
}

.totalValue {
  font-weight: 900;
  font-size: 22px;
  color: #0070f3;
  letter-spacing: 0.02em;
}

.toolbar {
  margin-bottom: 12px;
}

.btn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  color: #111827;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
}

.btn.primary {
  border-color: rgba(0, 140, 255, 0.2);
  background: rgba(0, 140, 255, 0.12);
  color: #0070f3;
}

.btn.small {
  padding: 6px 10px;
  font-size: 12px;
}

.btn.danger {
  border-color: rgba(255, 0, 80, 0.25);
  background: rgba(255, 0, 80, 0.08);
  color: #d50032;
}

.btn.danger.ghost {
  background: transparent;
}

.iconBtn {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: #ffffff;
  color: rgba(0, 0, 0, 0.75);
  border-radius: 10px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.iconBtn svg {
  width: 18px;
  height: 18px;
}

.iconBtn:hover {
  border-color: rgba(255, 0, 80, 0.35);
  color: #d50032;
}

.lineDeleteBtn {
  position: absolute;
  top: 10px;
  right: 10px;
}

.colDeleteBtn {
  width: 32px;
  height: 32px;
}

.confirmOverlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.confirmModal {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  padding: 14px;
}

.confirmTitle {
  font-weight: 900;
  margin-bottom: 10px;
  font-size: 15px;
}

.confirmText {
  color: rgba(0, 0, 0, 0.7);
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 14px;
}

.confirmActions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.lineCard {
  margin-bottom: 12px;
  position: relative;
}

.lineHead {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  flex-wrap: wrap;
  padding-right: 52px;
}

.fieldLabel {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: rgba(0, 0, 0, 0.65);
}

.input {
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 16px;
  background: #fff;
  width: 100%;
  box-sizing: border-box;
}

.altSection {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(0, 0, 0, 0.08);
}

.altTitleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.altTitleActions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.altTitle {
  font-weight: 800;
  font-size: 13px;
}

.hint {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.55);
  margin: 0 0 8px;
}

.compareWrap {
  --action-col-w: 3.25rem;
  /* 与 colgroup 一致，用于 sticky 的 left 偏移 */
  --col-product: 6rem;
  --col-price: 6rem;
  --col-link: 6rem;
  --col-custom: 6rem;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 0 -4px;
  padding: 4px;
  box-sizing: border-box;
}

.compareTable {
  width: max-content;
  max-width: none;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  /* auto：列宽随内容变长，colgroup / min-width 只作下限 */
  table-layout: auto;
}

.colWAction {
  min-width: var(--action-col-w);
}

.colWProduct {
  min-width: var(--col-product);
}

.colWPrice {
  min-width: var(--col-price);
}

.colWLink {
  min-width: var(--col-link);
}

.colWCustom {
  min-width: var(--col-custom);
}

.compareTable th,
.compareTable td {
  border: 1px solid rgba(0, 0, 0, 0.08);
  vertical-align: middle;
  padding: 4px 6px;
  background: #fff;
  box-sizing: border-box;
}

.compareTable thead th {
  background: rgba(0, 140, 255, 0.08);
  font-weight: 800;
  position: sticky;
  top: 0;
  z-index: 2;
  vertical-align: middle;
}

/* 实色背景（不透明），横滑时挡住后方单元格，避免文字叠在一起 */
.stickyCornerHead {
  position: sticky;
  left: 0;
  top: 0;
  z-index: 5 !important;
  min-width: var(--action-col-w);
  width: var(--action-col-w);
  max-width: var(--action-col-w);
  text-align: center;
  background-color: #d7ecff !important;
  background-clip: padding-box;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.08);
}

.stickyCornerBody {
  position: sticky;
  left: 0;
  z-index: 4;
  min-width: var(--action-col-w);
  width: var(--action-col-w);
  max-width: var(--action-col-w);
  text-align: center;
  font-weight: 800;
  background-color: #eef4fb !important;
  background-clip: padding-box;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.08);
}

.stickyProductHead {
  position: sticky;
  left: var(--action-col-w);
  top: 0;
  z-index: 4 !important;
  background-color: #e3f2ff !important;
  background-clip: padding-box;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.08);
}

.stickyProductBody {
  position: sticky;
  left: var(--action-col-w);
  z-index: 3;
  background-color: #ffffff !important;
  background-clip: padding-box;
  box-shadow: 4px 0 10px rgba(0, 0, 0, 0.08);
}

.rowActionInner {
  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.stickyCornerBody .colDeleteBtn {
  width: 28px;
  height: 28px;
}

.stickyCornerBody .colDeleteBtn svg {
  width: 16px;
  height: 16px;
}

.budgetCheck {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  cursor: pointer;
  margin: 0;
}

.colHead {
  white-space: nowrap;
}

.colHeadProduct {
  min-width: var(--col-product);
}

.colHeadPrice {
  min-width: var(--col-price);
}

.colHeadLink {
  min-width: var(--col-link);
}

.colHeadCustom {
  min-width: var(--col-custom);
}

.customColHeadInner {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.inputColTitle {
  flex: 0 1 auto;
  min-width: 3rem;
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  field-sizing: content;
  width: auto;
  max-width: none;
}

.attrColDeleteBtn {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
}

.attrColDeleteBtn svg {
  width: 15px;
  height: 15px;
}

.bodyCell {
  vertical-align: middle;
}

.bodyCellProduct {
  min-width: var(--col-product);
}

.bodyCellPrice {
  min-width: var(--col-price);
}

.bodyCellLink {
  min-width: var(--col-link);
}

.bodyCellCustom {
  min-width: var(--col-custom);
}

.compareTable .input {
  box-sizing: border-box;
}

/* field-sizing：输入框随文字变宽，从而撑开整列（Chrome 123+、Safari 17.4+、Firefox 136+） */
.inputProduct,
.inputCustom,
.inputColTitle {
  field-sizing: content;
  width: auto;
  max-width: none;
}

.inputProduct {
  min-width: var(--col-product);
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.inputPrice {
  min-width: var(--col-price);
  field-sizing: content;
  width: auto;
  max-width: none;
  margin: 0;
}

.inputLink {
  min-width: var(--col-link);
  field-sizing: content;
  width: auto;
  max-width: none;
  margin: 0;
  word-break: break-all;
  white-space: normal;
}

.inputCustom {
  min-width: var(--col-custom);
  margin: 0;
  white-space: normal;
  word-break: break-word;
}

.inlineField {
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  min-width: var(--col-link);
  width: max-content;
}

.inlineField .inputLink,
.inlineField .inlineGrow {
  flex: 0 1 auto;
  min-width: var(--col-link);
  max-width: none;
  margin: 0;
}

.inlineSuffix {
  flex-shrink: 0;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 700;
}

.extLink {
  color: #0070f3;
  text-decoration: none;
}

.extLink:hover {
  text-decoration: underline;
}

.addAttrRow td {
  background: transparent;
  border: none;
  padding-top: 12px;
}

.addAttrCell {
  text-align: left;
}

.emptyHint {
  text-align: center;
  color: rgba(0, 0, 0, 0.55);
  font-size: 14px;
  margin-top: 24px;
}
</style>
