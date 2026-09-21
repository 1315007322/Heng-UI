export type UiLibrary = 'ant' | 'element'
export interface ActionButtonProps {
  label?: string
  ui?: UiLibrary
  variant?: 'primary' | 'default' | 'danger'
  size?: 'small' | 'default' | 'large'
  loading?: boolean
  disabled?: boolean
}
export interface StatCardProps {
  title?: string
  value?: string | number
  change?: number
  description?: string
}
export interface EmptyStateProps {
  title?: string
  description?: string
  actionLabel?: string
  ui?: UiLibrary
}
export type EditorLanguage = 'javascript' | 'typescript' | 'jsx' | 'tsx' | 'json' | 'html' | 'css' | 'markdown' | 'python' | 'java' | 'sql' | 'yaml' | 'shell'
export type EditorMode = 'edit' | 'split' | 'preview'
export type EditorTheme = 'dark' | 'light'
export interface CodeEditorProps {
  modelValue?: string
  language?: EditorLanguage
  readonly?: boolean
  lineNumbers?: boolean
  minHeight?: number
  placeholder?: string
  tabSize?: number
  mode?: EditorMode
  theme?: EditorTheme
  wordWrap?: boolean
}
