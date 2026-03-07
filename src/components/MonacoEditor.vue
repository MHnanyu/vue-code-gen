<template>
  <div ref="editorContainer" class="monaco-editor-container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as monaco from 'monaco-editor'

const VUE_LANGUAGE_ID = 'vue'

function registerVueLanguage() {
  if (monaco.languages.getLanguages().some(lang => lang.id === VUE_LANGUAGE_ID)) {
    return
  }

  monaco.languages.register({
    id: VUE_LANGUAGE_ID,
    extensions: ['.vue'],
    aliases: ['Vue', 'vue'],
    mimetypes: ['text/x-vue'],
  })

  monaco.languages.setLanguageConfiguration(VUE_LANGUAGE_ID, {
    comments: {
      lineComment: '//',
      blockComment: ['/*', '*/']
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['<', '>']
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' },
      { open: '<', close: '>' }
    ],
    surroundingPairs: [
      { open: '"', close: '"' },
      { open: "'", close: "'" },
      { open: '`', close: '`' }
    ]
  })

  monaco.languages.setMonarchTokensProvider(VUE_LANGUAGE_ID, {
    defaultToken: '',
    tokenPostfix: '',

    tokenizer: {
      root: [
        [/<template(\s+[^>]*)?>/, { token: 'tag', next: '@template' }],
        [/<script(\s+[^>]*)?>/, { token: 'tag', next: '@script' }],
        [/<style(\s+[^>]*)?>/, { token: 'tag', next: '@style' }],
        [/<\/template>/, 'tag'],
        [/<\/script>/, 'tag'],
        [/<\/style>/, 'tag'],
        [/<[a-zA-Z][a-zA-Z0-9_-]*/, 'tag'],
        [/\/?>/, 'tag'],
        [/<\/[a-zA-Z][a-zA-Z0-9_-]*>/, 'tag'],
        [/{{/, { token: 'delimiter.curly', next: '@interpolation' }],
        [/<!--/, 'comment', '@comment'],
        [/\s+/, 'white'],
      ],
      template: [
        [/<\/template>/, { token: 'tag', next: '@pop' }],
        [/{{/, { token: 'delimiter.curly', next: '@interpolation' }],
        [/<!--/, 'comment', '@comment'],
        [/<script(\s+[^>]*)?>/, { token: 'tag', next: '@script' }],
        [/<style(\s+[^>]*)?>/, { token: 'tag', next: '@style' }],
        [/<[a-zA-Z][a-zA-Z0-9_-]*/, 'tag', '@tag_attrs'],
        [/\/?>/, 'tag'],
        [/<\/[a-zA-Z][a-zA-Z0-9_-]*>/, 'tag'],
        [/[^<]+/, 'text'],
      ],
      tag_attrs: [
        [/[a-zA-Z_:][-a-zA-Z0-9_:.]*/, 'attribute.name'],
        [/=/, 'delimiter'],
        [/"/, 'string', '@string_double'],
        [/'/, 'string', '@string_single'],
        [/>/, { token: 'tag', next: '@pop' }],
        [/\/>/, { token: 'tag', next: '@pop' }],
      ],
      string_double: [
        [/[^"]+/, 'string'],
        [/"/, 'string', '@pop'],
      ],
      string_single: [
        [/[^']+/, 'string'],
        [/'/, 'string', '@pop'],
      ],
      interpolation: [
        [/}}/, { token: 'delimiter.curly', next: '@pop' }],
        [/[a-zA-Z_$][\w$]*/, 'variable'],
        [/\d+/, 'number'],
        [/[+\-*/%&|!:=<>(){}[\]]/, 'operator'],
        [/\s+/, 'white'],
      ],
      script: [
        [/<\/script>/, { token: 'tag', next: '@pop' }],
        [/\/\/.*$/, 'comment'],
        [/\/\*/, 'comment', '@block_comment'],
        [/[a-zA-Z_$][\w$]*/, {
          cases: {
            '@keywords': 'keyword',
            '@default': 'identifier'
          }
        }],
        [/\d+\.?\d*/, 'number'],
        [/"/, 'string', '@js_string_double'],
        [/'/, 'string', '@js_string_single'],
        [/`/, 'string', '@js_string_backtick'],
        [/[+\-*/%&|^!:=<>(){}[\];,.]/, 'delimiter'],
        [/\s+/, 'white'],
      ],
      js_string_double: [
        [/[^"\\]+/, 'string'],
        [/\\./, 'string.escape'],
        [/"/, 'string', '@pop'],
      ],
      js_string_single: [
        [/[^'\\]+/, 'string'],
        [/\\./, 'string.escape'],
        [/'/, 'string', '@pop'],
      ],
      js_string_backtick: [
        [/[^`\\$]+/, 'string'],
        [/\\./, 'string.escape'],
        [/\$\{/, { token: 'delimiter.bracket', next: '@template_expr' }],
        [/`/, 'string', '@pop'],
      ],
      template_expr: [
        [/}/, { token: 'delimiter.bracket', next: '@pop' }],
        { include: 'script' },
      ],
      style: [
        [/<\/style>/, { token: 'tag', next: '@pop' }],
        [/\/\*.*?\*\//, 'comment'],
        [/[.#]?[a-zA-Z_-][a-zA-Z0-9_-]*/, 'tag'],
        [/[{]/, 'delimiter.bracket', '@css_rules'],
        [/\s+/, 'white'],
      ],
      css_rules: [
        [/}/, { token: 'delimiter.bracket', next: '@pop' }],
        [/[a-zA-Z-]+/, 'property'],
        [/:/, 'delimiter'],
        [/;|,/, 'delimiter'],
        [/\d+\.?\d*(px|em|rem|%|vh|vw|s|ms)?/, 'number'],
        [/#[a-fA-F0-9]{3,8}/, 'number.hex'],
        [/"[^"]*"|'[^']*'/, 'string'],
        [/\s+/, 'white'],
      ],
      comment: [
        [/[^-]+/, 'comment'],
        [/-->/, 'comment', '@pop'],
        [/-/, 'comment'],
      ],
      block_comment: [
        [/\*\//, 'comment', '@pop'],
        [/[^*]+/, 'comment'],
        [/\*/, 'comment'],
      ],
    },
    keywords: [
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
      'class', 'extends', 'new', 'this', 'super', 'import', 'export', 'from',
      'default', 'async', 'await', 'try', 'catch', 'throw', 'typeof', 'instanceof',
      'true', 'false', 'null', 'undefined', 'void', 'delete', 'in', 'of',
      'switch', 'case', 'break', 'continue', 'interface', 'type', 'enum',
      'implements', 'public', 'private', 'protected', 'readonly', 'static',
      'get', 'set', 'constructor', 'declare', 'namespace', 'module', 'as',
      'is', 'keyof', 'infer', 'never', 'unknown', 'any', 'string', 'number',
      'boolean', 'object', 'symbol', 'bigint', 'require'
    ],
  })
}

registerVueLanguage()

const props = withDefaults(defineProps<{
  value: string
  language: string
  readonly?: boolean
}>(), {
  readonly: false
})

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const editorContainer = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor | null = null

onMounted(() => {
  if (editorContainer.value) {
    editor = monaco.editor.create(editorContainer.value, {
      value: props.value,
      language: props.language,
      theme: 'vs',
      minimap: { enabled: false },
      automaticLayout: true,
      fontSize: 13,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      readOnly: props.readonly
    })

    editor.onDidChangeModelContent(() => {
      const value = editor?.getValue() || ''
      emit('update:value', value)
    })
  }
})

watch(() => props.value, (newValue) => {
  if (editor && editor.getValue() !== newValue) {
    editor.setValue(newValue)
  }
})

watch(() => props.language, (newLang) => {
  if (editor) {
    const model = editor.getModel()
    if (model) {
      monaco.editor.setModelLanguage(model, newLang)
    }
  }
})

watch(() => props.readonly, (newValue) => {
  if (editor) {
    editor.updateOptions({ readOnly: newValue })
  }
})

onUnmounted(() => {
  const model = editor?.getModel()
  editor?.dispose()
  model?.dispose()
})
</script>

<style scoped>
.monaco-editor-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}
</style>
