<template>
  <div class="ux-design-view">
    <el-card class="panel input-panel" shadow="hover">
      <template #header>
        <span>🎨 Design Requirements</span>
      </template>

      <el-input
        v-model="designPrompt"
        type="textarea"
        :rows="6"
        placeholder="Describe the UX design you want, e.g., Design a modern login page with social media login options..."
        resize="none"
      />

      <div class="options">
        <h3>Design Style</h3>
        <el-radio-group v-model="selectedStyle">
          <el-radio-button v-for="style in designStyles" :key="style.value" :value="style.value">
            {{ style.label }}
          </el-radio-button>
        </el-radio-group>
      </div>

      <el-button
        type="success"
        :loading="isGenerating"
        :disabled="!designPrompt.trim()"
        @click="generateDesign"
      >
        {{ isGenerating ? 'Generating...' : 'Generate Design' }}
      </el-button>
    </el-card>

    <el-card class="panel output-panel" shadow="hover">
      <template v-if="generatedDesign">
        <div class="design-preview">
          <div class="mockup-frame">
            <div class="mockup-content" v-html="generatedDesign.html"></div>
          </div>
        </div>

        <el-divider />

        <div class="design-specs">
          <h3>📐 Design Specifications</h3>

          <el-descriptions :column="1" border>
            <el-descriptions-item label="Color Palette">
              <div class="color-palette">
                <el-tooltip
                  v-for="color in generatedDesign.colors"
                  :key="color"
                  :content="color"
                  placement="top"
                >
                  <div class="color-swatch" :style="{ background: color }" />
                </el-tooltip>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="Typography">
              {{ generatedDesign.typography }}
            </el-descriptions-item>
            <el-descriptions-item label="Spacing System">
              {{ generatedDesign.spacing }}
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </template>

      <el-empty v-else description="Describe your design requirements on the left and click Generate Design" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface GeneratedDesign {
  html: string
  colors: string[]
  typography: string
  spacing: string
}

const designStyles = [
  { label: 'Modern Minimal', value: 'modern' },
  { label: 'Flat Design', value: 'flat' },
  { label: 'Glassmorphism', value: 'glassmorphism' },
  { label: 'Neumorphism', value: 'neumorphism' },
  { label: 'Gradient', value: 'gradient' }
]

const designPrompt = ref('')
const selectedStyle = ref('modern')
const isGenerating = ref(false)
const generatedDesign = ref<GeneratedDesign | null>(null)

async function generateDesign() {
  if (!designPrompt.value.trim()) return

  isGenerating.value = true

  // TODO: Call actual AI generation API
  setTimeout(() => {
    generatedDesign.value = {
      html: `
        <div style="padding: 2rem; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 400px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: white;">
          <h2 style="font-size: 2rem; margin-bottom: 1rem; font-weight: bold;">Design Preview</h2>
          <p style="opacity: 0.9; margin-bottom: 2rem;">UX mockup based on your requirements will appear here</p>
          <button style="background: white; color: #764ba2; border: none; padding: 0.75rem 2rem; border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            Sample Button
          </button>
        </div>
      `,
      colors: ['#667eea', '#764ba2', '#ffffff', '#333333', '#666666'],
      typography: 'Headings: Inter 24px Bold, Body: Inter 16px Regular',
      spacing: 'Base unit: 8px, Small: 8px, Medium: 16px, Large: 24px'
    }
    isGenerating.value = false
  }, 1500)
}
</script>

<style scoped>
.ux-design-view {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  height: calc(100vh - 120px);
  padding: 1rem;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.input-panel :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.options {
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.options h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #333;
}

.output-panel :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.design-output {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.mockup-frame {
  border: 1px solid #ddd;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.mockup-content {
  min-height: 300px;
}

.design-specs h3 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.1rem;
}

.color-palette {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.color-swatch:hover {
  transform: scale(1.1);
}
</style>