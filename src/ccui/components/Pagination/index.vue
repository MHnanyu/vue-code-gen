<template>
  <el-pagination
    v-model:current-page="currentPage"
    v-model:page-size="pageSize"
    :page-sizes="pageSizes"
    :pager-count="pagerCount"
    :total="total"
    :layout="layout"
    :background="background"
    :disabled="disabled"
    :small="small"
    :hide-on-single-page="hideOnSinglePage"
    :prev-text="prevText"
    :next-text="nextText"
    @current-change="handleCurrentChange"
    @page-size-change="handlePageSizeChange"
    @prev-click="handlePrevClick"
    @next-click="handleNextClick"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  name: 'CcPagination',
  inheritAttrs: false
})

interface Props {
  currentPage?: number
  pageSize?: number
  pageSizes?: number[]
  pagerCount?: number
  total?: number
  layout?: string
  background?: boolean
  disabled?: boolean
  small?: boolean
  hideOnSinglePage?: boolean
  prevText?: string
  nextText?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentPage: 1,
  pageSize: 10,
  pageSizes: () => [10, 20, 30, 50, 100],
  pagerCount: 7,
  total: 0,
  layout: 'total, sizes, prev, pager, next, jumper',
  background: true,
  disabled: false,
  small: false,
  hideOnSinglePage: false
})

const emit = defineEmits<{
  'update:currentPage': [page: number]
  'update:pageSize': [size: number]
  'current-change': [page: number]
  'page-size-change': [size: number]
  'prev-click': [page: number]
  'next-click': [page: number]
}>()

const currentPage = computed({
  get: () => props.currentPage,
  set: (val: number) => emit('update:currentPage', val)
})

const pageSize = computed({
  get: () => props.pageSize,
  set: (val: number) => emit('update:pageSize', val)
})

const handleCurrentChange = (val: number) => {
  emit('current-change', val)
}

const handlePageSizeChange = (val: number) => {
  emit('page-size-change', val)
}

const handlePrevClick = (val: number) => {
  emit('prev-click', val)
}

const handleNextClick = (val: number) => {
  emit('next-click', val)
}
</script>
