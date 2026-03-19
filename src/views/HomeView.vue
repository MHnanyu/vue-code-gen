<template>
  <div class="min-h-[calc(100vh-60px)] flex items-center justify-center px-6 py-10 bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="max-w-3xl w-full text-center">
      <h1 class="text-5xl font-semibold text-gray-800 mb-3 flex items-center justify-center gap-3 leading-normal">
        <span class="text-4xl">✨</span>
        <span class="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-normal">
          Page Generator
        </span>
      </h1>
      <p class="text-xl text-gray-600 mb-10">输入需求，智能生成页面原型</p>

      <el-card class="rounded-2xl mb-6" shadow="always">
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
            <el-tag type="success" effect="plain" size="large">Vue3</el-tag>
            <el-select v-model="selectedLib" style="width: 140px">
              <el-option label="ElementUI" value="ElementUI" />
              <el-option label="AUI" value="aui" />
              <el-option label="CcUI" value="ccui" />
            </el-select>
          </div>

          <div class="flex items-center gap-3">
            <el-tooltip content="上传图片" placement="top">
              <el-upload
                v-model:file-list="imageList"
                :auto-upload="false"
                accept="image/*"
                :limit="5"
                :show-file-list="false"
                :on-change="handleImageChange"
              >
                <el-button circle>
                  <el-icon size="18"><Picture /></el-icon>
                </el-button>
              </el-upload>
            </el-tooltip>
            <el-tooltip content="上传附件" placement="top">
              <el-upload
                v-model:file-list="attachList"
                :auto-upload="false"
                accept=".md,.txt"
                :limit="5"
                :show-file-list="false"
                :on-change="handleAttachChange"
              >
                <el-button circle>
                  <el-icon size="18"><Paperclip /></el-icon>
                </el-button>
              </el-upload>
            </el-tooltip>

            <el-button type="success" :loading="loading" :disabled="!canGenerate" @click="handleGenerate">
              生成 ➤
            </el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGeneratorStore } from '@/stores/generator'
import { useChatStore } from '@/stores/chat'
import { uploadFiles as apiUploadFiles, type Attachment } from '@/api'
import type { ComponentLib } from '@/types'
import type { UploadFile, UploadUserFile } from 'element-plus'
import { Paperclip, Picture, Document, Close } from '@element-plus/icons-vue'

const router = useRouter()
const store = useGeneratorStore()
const chatStore = useChatStore()

const prompt = ref('')
const selectedLib = ref('aui')
const loading = ref(false)
const imageList = ref<UploadUserFile[]>([])
const attachList = ref<UploadUserFile[]>([])

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

    store.setPrompt(finalPrompt)
    store.clearFiles()
    chatStore.setPendingPrompt(finalPrompt)
    chatStore.setPendingAttachments(attachments)

    const sessionId = await chatStore.createSessionRemote(
      prompt.value.slice(0, 30) || `基于${attachments.length}个文件生成`,
      selectedLib.value as ComponentLib
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
</style>
