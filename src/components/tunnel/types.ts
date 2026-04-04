import type { VNode } from 'vue'
export type { EditFormData, Tunnel } from '@/types/tunnel'

/**
 * 更多菜单选项接口
 * 定义下拉菜单中的选项结构
 */
export interface MoreMenuOption {
  label: string
  key: string
  icon?: () => VNode
  type?: 'divider'
}

/**
 * 配置文件格式类型
 */
export type ConfigFormat = 'toml' | 'json' | 'yml' | 'ini'

/**
 * 配置内容对象接口
 * 包含不同格式的配置文件内容
 */
export interface ConfigContents {
  toml?: string
  json?: string
  yml?: string
  ini?: string
}
