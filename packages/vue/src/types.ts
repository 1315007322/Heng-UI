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
