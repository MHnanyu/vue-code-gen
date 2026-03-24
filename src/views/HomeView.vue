<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
    <div class="aurora-bg"></div>
    <div class="max-w-3xl w-full text-center relative z-10">
      <h1 class="text-5xl font-semibold text-gray-800 mb-3 flex items-center justify-center gap-3 leading-normal">
        <span class="text-4xl">✨</span>
        <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-normal">
          Design AI
        </span>
      </h1>
      <p class="text-xl text-gray-600 mb-10">今天，我可以帮你设计什么？</p>

      <div ref="glowWrapRef" class="glow-border-wrap">
        <svg class="glow-svg" aria-hidden="true">
          <defs>
            <linearGradient id="glowGrad" gradientUnits="userSpaceOnUse" :x1="0" :y1="0" :x2="lineLen" :y2="0">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0" />
              <stop offset="15%" stop-color="#6366f1" stop-opacity="0.6" />
              <stop offset="40%" stop-color="#a78bfa" stop-opacity="1" />
              <stop offset="60%" stop-color="#c4b5fd" stop-opacity="1" />
              <stop offset="85%" stop-color="#c084fc" stop-opacity="0.6" />
              <stop offset="100%" stop-color="#e879f9" stop-opacity="0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect
            ref="glowRectRef"
            :x="5.5" :y="5.5" :width="rectW" :height="rectH"
            :rx="borderRadius" :ry="borderRadius"
            fill="none"
            stroke="url(#glowGrad)"
            :stroke-width="strokeW"
            :stroke-dasharray="lineLen + ' ' + perimeter"
            stroke-linecap="butt"
            filter="url(#glow)"
          />
        </svg>
        <el-card class="glow-card" shadow="always">
        <el-input
          v-model="prompt"
          type="textarea"
          :rows="5"
          placeholder="输入你的需求，例如：&#10;生成一个登录页面，包含用户名密码输入框、记住我选项和第三方登录"
          resize="none"
          @keydown.enter.ctrl="handleGenerate"
        />

        <div v-if="fileList.length > 0" class="mt-4 flex flex-wrap gap-3">
          <div
            v-for="file in fileList"
            :key="file.uid || file.name"
            class="relative group inline-block"
          >
            <div class="relative">
              <el-popover
                v-if="isImageFile(file)"
                placement="top"
                :width="200"
                trigger="hover"
              >
                <template #reference>
                  <div class="w-16 h-16 rounded-lg overflow-hidden border-2 border-gray-200 cursor-pointer hover:border-indigo-400 transition-colors">
                    <img :src="getFilePreview(file)" class="w-full h-full object-cover" />
                  </div>
                </template>
                <img :src="getFilePreview(file)" class="w-full rounded" />
              </el-popover>
              <div
                v-else
                class="w-16 h-16 rounded-lg border-2 border-gray-200 flex flex-col items-center justify-center bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer"
              >
                <el-icon size="20" class="text-blue-500"><Document /></el-icon>
                <span class="text-xs text-gray-500 mt-1 max-w-[56px] truncate">{{ getFileExtension(file.name) }}</span>
              </div>
              <div
                class="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-5 h-5 bg-gray-500 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600"
                @click="removeFile(file)"
              >
                <el-icon size="12" color="white"><Close /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
          <div class="flex gap-3 items-center">
            <el-upload
              v-model:file-list="imageList"
              :auto-upload="false"
              accept="image/*"
              :limit="5"
              :show-file-list="false"
              :on-change="handleImageChange"
            >
              <el-button>上传图片</el-button>
            </el-upload>
            <el-upload
              v-model:file-list="attachList"
              :auto-upload="false"
              accept=".md,.txt"
              :limit="5"
              :show-file-list="false"
              :on-change="handleAttachChange"
            >
              <el-button>上传附件</el-button>
            </el-upload>
          </div>

          <div class="flex items-center gap-3">
            <el-select v-model="selectedLib" placeholder="组件库" style="width: 140px">
              <el-option label="ElementUI" value="ElementUI" />
              <el-option label="AUI" value="aui" />
              <el-option label="CcUI" value="ccui" />
            </el-select>
            <el-button type="success" :loading="loading" :disabled="!canGenerate" @click="handleGenerate">
              生成 ➤
            </el-button>
          </div>
        </div>
      </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { uploadFiles as apiUploadFiles, type Attachment } from '@/api'
import type { ComponentLib } from '@/types'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Document, Close } from '@element-plus/icons-vue'

const router = useRouter()
const chatStore = useChatStore()

const prompt = ref('')
const selectedLib = ref('')
const loading = ref(false)
const imageList = ref<UploadUserFile[]>([])
const attachList = ref<UploadUserFile[]>([])

const glowWrapRef = ref<HTMLElement | null>(null)
const glowRectRef = ref<SVGRectElement | null>(null)
const rectW = ref(0)
const rectH = ref(0)
const perimeter = ref(0)
const lineLen = 200
const borderRadius = 18
const strokeW = 5

let resizeObserver: ResizeObserver | null = null

const outlineW = 5

let animFrameId: number | null = null

function updateGlowSize() {
  if (!glowWrapRef.value) return
  const w = glowWrapRef.value.offsetWidth
  const h = glowWrapRef.value.offsetHeight
  rectW.value = w + outlineW - strokeW
  rectH.value = h + outlineW - strokeW
  const p = 2 * (rectW.value + rectH.value)
  perimeter.value = p - lineLen

  if (glowRectRef.value) {
    if (animFrameId) cancelAnimationFrame(animFrameId)
    const svgEl = glowRectRef.value.closest('svg')!
    const gradEl = svgEl.querySelector('#glowGrad') as SVGLinearGradientElement | null
    const stopEls = gradEl ? Array.from(gradEl.querySelectorAll('stop')) : []
    const xOff = 5.5
    const yOff = 5.5
    const hw = rectW.value
    const hh = rectH.value
    const r = borderRadius
    const totalP = p
    const speed = totalP / 12000

    function getPointOnPerimeter(dist: number): { x: number; y: number; angle: number } {
      const d = ((dist % totalP) + totalP) % totalP
      const cornerArc = Math.PI * r / 2
      const topStraight = hw - 2 * r
      const rightStraight = hh - 2 * r
      const bottomStraight = hw - 2 * r
      const leftStraight = hh - 2 * r

      let seg = 0
      let d2 = d
      const segments = [topStraight, cornerArc, rightStraight, cornerArc, bottomStraight, cornerArc, leftStraight, cornerArc]

      for (let i = 0; i < segments.length; i++) {
        if (d2 <= segments[i] + 0.001) {
          seg = i
          break
        }
        d2 -= segments[i]
        if (i === segments.length - 1) { seg = i; d2 = segments[i] }
      }

      const cx = xOff + r
      const cy = yOff + r
      const rx = xOff + hw - r
      const ry = yOff + hh - r

      let x: number, y: number, angle: number
      switch (seg) {
        case 0: x = cx + d2; y = yOff; angle = 0; break
        case 1: { const a = d2 / cornerArc * (Math.PI / 2); x = rx - r + r * Math.sin(a); y = cy - r + r * (1 - Math.cos(a)); angle = a; break }
        case 2: x = xOff + hw; y = cy + d2; angle = Math.PI / 2; break
        case 3: { const a = d2 / cornerArc * (Math.PI / 2); x = rx - r + r * Math.cos(a); y = ry - r + r * Math.sin(a); angle = Math.PI / 2 + a; break }
        case 4: x = rx - d2; y = yOff + hh; angle = Math.PI; break
        case 5: { const a = d2 / cornerArc * (Math.PI / 2); x = cx + r - r * Math.sin(a); y = ry - r + r * Math.cos(a); angle = Math.PI + a; break }
        case 6: x = xOff; y = ry - d2; angle = 3 * Math.PI / 2; break
        case 7: { const a = d2 / cornerArc * (Math.PI / 2); x = cx - r + r * (1 - Math.cos(a)); y = cy + r - r * Math.sin(a); angle = 3 * Math.PI / 2 + a; break }
        default: x = 0; y = 0; angle = 0
      }
      return { x, y, angle }
    }

    let lastTime: number | null = null
    let accumulated = 0

    function animate(time: number) {
      if (lastTime !== null) {
        accumulated += (time - lastTime) * speed
      }
      lastTime = time

      const offset = accumulated % totalP
      glowRectRef.value!.setAttribute('stroke-dashoffset', String(-offset))

      if (gradEl) {
        const p1 = getPointOnPerimeter(offset)
        const p2 = getPointOnPerimeter(offset + lineLen)
        gradEl.setAttribute('x1', String(p1.x))
        gradEl.setAttribute('y1', String(p1.y))
        gradEl.setAttribute('x2', String(p2.x))
        gradEl.setAttribute('y2', String(p2.y))

        if (stopEls.length >= 6) {
          const phase = Math.sin(time * 0.0008) * 40
          const base = 280 + phase
          stopEls[1].setAttribute('stop-color', `hsl(${base}, 72%, 58%)`)
          stopEls[2].setAttribute('stop-color', `hsl(${base + 10}, 72%, 63%)`)
          stopEls[3].setAttribute('stop-color', `hsl(${base + 20}, 72%, 68%)`)
          stopEls[4].setAttribute('stop-color', `hsl(${base + 30}, 72%, 63%)`)
        }
      }

      animFrameId = requestAnimationFrame(animate)
    }

    animFrameId = requestAnimationFrame(animate)
  }
}

const fileList = computed(() => [...imageList.value, ...attachList.value])

const canGenerate = computed(() => {
  return prompt.value.trim() || fileList.value.length > 0
})

function isImageFile(file: UploadFile) {
  return file.raw?.type.startsWith('image/')
}

function getFilePreview(file: UploadFile) {
  if (file.raw) {
    return URL.createObjectURL(file.raw)
  }
  return ''
}

function getFileExtension(filename: string) {
  const ext = filename.split('.').pop()?.toUpperCase()
  return ext || 'FILE'
}

function handleImageChange(_file: UploadFile, files: UploadUserFile[]) {
  imageList.value = files
}

function handleAttachChange(_file: UploadFile, files: UploadUserFile[]) {
  attachList.value = files
}

function removeFile(file: UploadFile) {
  let index = imageList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    imageList.value.splice(index, 1)
    return
  }
  index = attachList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    attachList.value.splice(index, 1)
  }
}

onMounted(async () => {
  await nextTick()
  updateGlowSize()
  resizeObserver = new ResizeObserver(updateGlowSize)
  if (glowWrapRef.value) {
    resizeObserver.observe(glowWrapRef.value)
  }
})

onUnmounted(() => {
  resizeObserver?.disconnect()
  if (animFrameId) cancelAnimationFrame(animFrameId)
})

async function handleGenerate() {
  if (!canGenerate.value || loading.value) return

  loading.value = true
  try {
    let attachments: Attachment[] = []

    if (fileList.value.length > 0) {
      const files = fileList.value.filter(f => f.raw).map(f => f.raw!)
      const result = await apiUploadFiles(files)
      attachments = result.files
    }

    const finalPrompt = prompt.value.trim() || `根据上传的${attachments.length}个文件生成页面`

    chatStore.setPendingPrompt(finalPrompt)
    chatStore.setPendingAttachments(attachments)

    const sessionId = await chatStore.createSessionRemote(
      prompt.value.slice(0, 30) || `基于${attachments.length}个文件生成`,
      (selectedLib.value || 'ElementUI') as ComponentLib
    )
    if (sessionId) {
      router.push({ path: '/workspace', query: { session_id: sessionId } })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 24px;
}

:deep(.el-textarea__inner) {
  font-size: 16px;
  line-height: 1.6;
  box-shadow: none;
}

.glow-border-wrap {
  position: relative;
  border-radius: 18px;
  padding: 2px;
  margin-bottom: 24px;
}

.glow-svg {
  position: absolute;
  top: -5px;
  left: -5px;
  right: -5px;
  bottom: -5px;
  z-index: 2;
  pointer-events: none;
  overflow: visible;
}

.glow-card {
  position: relative;
  z-index: 1;
  border: none;
  border-radius: 18px;
  outline: 5px solid #d1d5db;
}

.aurora-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 40%;
  background: linear-gradient(
    180deg,
    rgba(238, 242, 255, 0.9) 0%,
    rgba(225, 232, 255, 0.7) 60%,
    transparent 100%
  );
  z-index: 0;
  overflow: hidden;
}

.aurora-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 600px 300px at 20% 40%, rgba(140, 130, 230, 0.25) 0%, transparent 70%),
    radial-gradient(ellipse 500px 250px at 60% 30%, rgba(100, 190, 220, 0.2) 0%, transparent 70%),
    radial-gradient(ellipse 400px 200px at 80% 60%, rgba(170, 140, 220, 0.18) 0%, transparent 70%);
  animation: auroraWave 4s ease-in-out infinite alternate;
}

.aurora-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 500px 200px at 30% 50%, rgba(200, 160, 210, 0.18) 0%, transparent 70%),
    radial-gradient(ellipse 450px 220px at 70% 25%, rgba(130, 175, 220, 0.2) 0%, transparent 70%);
  animation: auroraWave 5s ease-in-out infinite alternate-reverse;
}

@keyframes auroraShift {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

@keyframes auroraWave {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 0.7;
  }
  33% {
    transform: translate(80px, -40px) scale(1.15) rotate(3deg);
    opacity: 1;
  }
  66% {
    transform: translate(-60px, 30px) scale(0.9) rotate(-2deg);
    opacity: 0.6;
  }
  100% {
    transform: translate(50px, -20px) scale(1.1) rotate(2deg);
    opacity: 0.85;
  }
}
</style>
