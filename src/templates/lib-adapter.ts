import type { ComponentLib, ProjectFile } from '@/types'

export interface LibAdapter {
  getMainTs(): string
  getExtraSrcChildren(): ProjectFile[]
  getDependencies(): Record<string, string>
}

const adapterMap = new Map<ComponentLib, LibAdapter>()

export function registerLib(lib: ComponentLib, adapter: LibAdapter): void {
  adapterMap.set(lib, adapter)
}

export function getLibAdapter(lib: ComponentLib): LibAdapter {
  const adapter = adapterMap.get(lib)
  if (!adapter) {
    throw new Error(`Unknown component library: ${lib}`)
  }
  return adapter
}
