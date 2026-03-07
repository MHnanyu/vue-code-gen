<template>
  <div>
    <div
      class="file-item group flex items-center gap-2 p-2 cursor-pointer rounded transition-colors hover:bg-gray-50"
      :class="[
        node.id === selectedFileId ? 'bg-blue-50 text-blue-500' : '',
        node.type === 'folder' ? 'font-medium' : '',
        isReadonly ? 'opacity-70' : ''
      ]"
      :style="{ paddingLeft: `${depth * 16 + 8}px` }"
      @click="handleClick(node)"
      @dblclick="handleDoubleClick(node)"
    >
      <span class="flex items-center">
        <template v-if="node.type === 'folder'">
          <el-icon v-if="isExpanded(node.id)" color="#e6a23c"><FolderOpened /></el-icon>
          <el-icon v-else color="#e6a23c"><Folder /></el-icon>
        </template>
        <template v-else>
          <el-icon :color="getFileIconColor(node.language || '')"><Document /></el-icon>
        </template>
      </span>
      <template v-if="isEditing">
        <input
          ref="inputRef"
          v-model="editName"
          class="edit-input"
          @click.stop
          @blur="handleRenameSubmit"
          @keyup.enter="handleRenameSubmit"
          @keyup.escape="cancelEdit"
        />
      </template>
      <template v-else>
        <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ node.name }}</span>
      </template>
      <el-tag v-if="isReadonly && node.type === 'file'" size="small" type="info">只读</el-tag>
      <el-button
        v-if="!isReadonly && node.type === 'file'"
        text
        size="small"
        class="opacity-0 group-hover:opacity-100 !p-0 !w-5 !h-5"
        @click.stop="handleDelete(node)"
      >
        <el-icon size="14"><Delete /></el-icon>
      </el-button>
    </div>

    <div v-if="node.type === 'folder' && node.children && isExpanded(node.id)" class="tree-children">
      <FileTreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selected-file-id="selectedFileId"
        :is-readonly="isReadonly"
        :default-expanded-ids="defaultExpandedIds"
        @select="$emit('select', $event)"
        @delete="$emit('delete', $event)"
        @rename="$emit('rename', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { Folder, FolderOpened, Document, Delete } from '@element-plus/icons-vue'
import type { ProjectFile } from '@/types'

const props = withDefaults(defineProps<{
  node: ProjectFile
  depth?: number
  selectedFileId?: string | null
  isReadonly?: boolean
  defaultExpandedIds?: string[]
}>(), {
  depth: 0,
  isReadonly: false,
  defaultExpandedIds: () => []
})

const emit = defineEmits<{
  select: [file: ProjectFile]
  delete: [file: ProjectFile]
  rename: [file: ProjectFile, newName: string]
}>()

const expandedIds = ref<Set<string>>(new Set(props.defaultExpandedIds))

const isEditing = ref(false)
const editName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(() => props.node.name, () => {
  isEditing.value = false
})

function isExpanded(id: string): boolean {
  return expandedIds.value.has(id)
}

function handleClick(node: ProjectFile) {
  if (isEditing.value) return
  
  if (node.type === 'folder') {
    if (isExpanded(node.id)) {
      expandedIds.value.delete(node.id)
    } else {
      expandedIds.value.add(node.id)
    }
    expandedIds.value = new Set(expandedIds.value)
  } else {
    emit('select', node)
  }
}

function handleDoubleClick(node: ProjectFile) {
  if (props.isReadonly || node.type === 'folder') return
  
  isEditing.value = true
  editName.value = node.name
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function handleRenameSubmit() {
  if (!isEditing.value) return
  
  const newName = editName.value.trim()
  if (newName && newName !== props.node.name) {
    emit('rename', props.node, newName)
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
  editName.value = ''
}

function handleDelete(node: ProjectFile) {
  emit('delete', node)
}

function getFileIconColor(language: string): string {
  const colors: Record<string, string> = {
    vue: '#42b883',
    typescript: '#3178c6',
    javascript: '#f7df1e',
    html: '#e34c26',
    css: '#264de4',
    json: '#cbcb41'
  }
  return colors[language] || '#909399'
}
</script>

<style scoped>
.edit-input {
  flex: 1;
  height: 20px;
  padding: 0 4px;
  border: 1px solid #409eff;
  border-radius: 2px;
  outline: none;
  font-size: inherit;
}
</style>
