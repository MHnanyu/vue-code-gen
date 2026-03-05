<template>
  <div class="ux-design-view">
    <div class="panel input-panel">
      <h2>🎨 Design Requirements</h2>
      <textarea
        v-model="designPrompt"
        placeholder="Describe the UX design you want, e.g., Design a modern login page with social media login options..."
        rows="6"
      ></textarea>
      
      <div class="options">
        <h3>Design Style</h3>
        <div class="style-options">
          <label v-for="style in designStyles" :key="style.value">
            <input type="radio" v-model="selectedStyle" :value="style.value" />
            {{ style.label }}
          </label>
        </div>
      </div>
      
      <div class="actions">
        <button class="btn-primary" @click="generateDesign" :disabled="isGenerating">
          {{ isGenerating ? 'Generating...' : 'Generate Design' }}
        </button>
      </div>
    </div>
    
    <div class="panel output-panel">
      <div class="design-output" v-if="generatedDesign">
        <div class="design-preview">
          <div class="mockup-frame">
            <div class="mockup-content" v-html="generatedDesign.html"></div>
          </div>
        </div>
        
        <div class="design-specs">
          <h3>📐 Design Specifications</h3>
          <div class="spec-section">
            <h4>Color Palette</h4>
            <div class="color-palette">
              <div v-for="color in generatedDesign.colors" :key="color"
                   class="color-swatch" :style="{ background: color }">
                <span>{{ color }}</span>
              </div>
            </div>
          </div>
          
          <div class="spec-section">
            <h4>Typography</h4>
            <p>{{ generatedDesign.typography }}</p>
          </div>
          
          <div class="spec-section">
            <h4>Spacing System</h4>
            <p>{{ generatedDesign.spacing }}</p>
          </div>
        </div>
      </div>
      
      <div class="empty-state" v-else>
        <p>Describe your design requirements on the left and click Generate Design</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const designPrompt = ref('')
const selectedStyle = ref('modern')
const isGenerating = ref(false)
const generatedDesign = ref<{
  html: string
  colors: string[]
  typography: string
  spacing: string
} | null>(null)

const designStyles = [
  { label: 'Modern Minimal', value: 'modern' },
  { label: 'Flat Design', value: 'flat' },
  { label: 'Glassmorphism', value: 'glassmorphism' },
  { label: 'Neumorphism', value: 'neumorphism' },
  { label: 'Gradient', value: 'gradient' }
]

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
  background: white;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  overflow: auto;
}

.input-panel textarea {
  flex: 1;
  resize: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  font-family: inherit;
}

.options {
  margin-bottom: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.options h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
  color: #333;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.style-options label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-primary {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  flex: 1;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.design-specs {
  background: #f9f9f9;
  padding: 1.25rem;
  border-radius: 8px;
  border-left: 4px solid #42b883;
}

.design-specs h3 {
  margin: 0 0 1rem;
  color: #333;
  font-size: 1.1rem;
}

.spec-section {
  margin-bottom: 1.25rem;
}

.spec-section:last-child {
  margin-bottom: 0;
}

.spec-section h4 {
  margin: 0 0 0.5rem;
  color: #555;
  font-size: 0.95rem;
}

.spec-section p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.color-palette {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-swatch {
  width: 70px;
  height: 45px;
  border-radius: 6px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.color-swatch span {
  font-size: 0.65rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 2px 5px;
  border-radius: 3px;
  font-family: monospace;
  color: #333;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 1.1rem;
  text-align: center;
}
</style>