// @flexcms/ui — FlexCMS Design System
// Themed, accessible UI primitives for the Admin UI and beyond.

// Components
export { Button, buttonVariants, type ButtonProps } from './components/Button';
export { Input, type InputProps } from './components/Input';
export { Label, type LabelProps } from './components/Label';
export { Textarea, type TextareaProps } from './components/Textarea';
export { Badge, type BadgeProps } from './components/Badge';
export {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from './components/Card';
export { Separator, Skeleton, Avatar, type SeparatorProps, type AvatarProps } from './components/Misc';

// Overlay / modal components
export {
  Dialog, DialogTrigger, DialogClose, DialogPortal,
  DialogOverlay, DialogContent, type DialogContentProps,
  DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from './components/Dialog';
export {
  Sheet, SheetTrigger, SheetClose, SheetPortal,
  SheetOverlay, SheetContent, type SheetContentProps,
  SheetHeader, SheetFooter, SheetTitle, SheetDescription,
} from './components/Sheet';
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuGroup, DropdownMenuPortal,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  DropdownMenuRadioGroup, DropdownMenuRadioItem,
  DropdownMenuItem, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from './components/DropdownMenu';

// Tabs, Accordion, Popover, Tooltip
export { Tabs, TabsList, TabsTrigger, TabsContent } from './components/Tabs';
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from './components/Accordion';
export {
  Popover, PopoverTrigger, PopoverAnchor, PopoverClose, PopoverContent,
} from './components/Popover';
export { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from './components/Tooltip';

// DataTable
export {
  DataTable, type DataTableProps,
  Table, TableHeader, TableBody, TableFooter,
  TableRow, TableHead, TableCell, TableCaption,
} from './components/DataTable';

// TreeView, Sidebar, Breadcrumb
export { TreeView, type TreeViewProps, type TreeNode } from './components/TreeView';
export {
  SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton, type SidebarMenuButtonProps,
  SidebarSeparator, SidebarToggleButton,
} from './components/Sidebar';
export {
  Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink,
  BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis,
} from './components/Breadcrumb';

// Form controls: Select, Checkbox, Radio, Switch, DatePicker
export {
  Select, SelectGroup, SelectValue, SelectTrigger, SelectContent,
  SelectLabel, SelectItem, SelectSeparator,
  SelectScrollUpButton, SelectScrollDownButton,
} from './components/Select';
export { Checkbox } from './components/Checkbox';
export { RadioGroup, RadioGroupItem } from './components/RadioGroup';
export { Switch } from './components/Switch';
export { DatePicker, DateRangePicker, type DatePickerProps, type DateRangePickerProps, type DateRange } from './components/DatePicker';

// Theming
export {
  lightTheme, darkTheme, applyTheme, createTheme, type ThemeTokens,
} from './themes/index';

// Utilities
export { cn } from './lib/utils';

