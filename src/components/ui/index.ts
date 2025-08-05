// src/components/ui/index.ts

// Toast functionality
export { Toast } from './toast'
export { useToast, toast, reducer } from './use-toast'

// Theme functionality
export { ThemeToggle } from './theme-toggle'

// Table functionality
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from './table'

// Sidebar functionality
export { 
  Sidebar, 
  SidebarProvider, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarTrigger, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  useSidebar 
} from './sidebar'

// Layout and navigation
export { Separator } from './separator'

// Form controls
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
export { Popover, PopoverContent, PopoverTrigger } from './popover'
export { Label } from './label'
export { Input } from './input'
export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from './form'
export { Checkbox } from './checkbox'
export { Switch } from './switch'

// Dropdown menu functionality
export { 
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup
} from './dropdown-menu'

// Dialog functionality
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'

// Date range picker functionality (component needs to be created)
// export { DateRangePicker } from './date-range-picker'

// Confirmation dialog functionality  
export { ConfirmationDialog } from './confirmation-dialog'

// Auth dropdown
export { AuthDropdown } from './auth-dropdown'

// Drill down modal
export { DrillDownModal } from './drill-down-modal'

// Layout components
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card'

// Date and calendar
export { Calendar } from './calendar'

// Basic UI elements
export { Button, buttonVariants } from './button'
export { Badge, badgeVariants } from './badge'
export { Avatar, AvatarImage, AvatarFallback } from './avatar'
export { Progress } from './progress'
export { Alert, AlertDescription, AlertTitle } from './alert'

// Status and indicators
export { StatusIndicator } from './status-indicator'

// Utility components
export { ScrollArea } from './scroll-area'
export { SkipNavigation } from './skip-navigation'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip'