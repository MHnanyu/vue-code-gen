import type { ProjectFile } from '@/types'

import AffixIndex from '../ccui/components/Affix/index.vue?raw'
import AnchorIndex from '../ccui/components/Anchor/index.vue?raw'
import AutocompleteIndex from '../ccui/components/Autocomplete/index.vue?raw'
import AvatarIndex from '../ccui/components/Avatar/index.vue?raw'
import BacktopIndex from '../ccui/components/Backtop/index.vue?raw'
import BorderIndex from '../ccui/components/Border/index.vue?raw'
import BreadcrumbIndex from '../ccui/components/Breadcrumb/index.vue?raw'
import BreadcrumbItemIndex from '../ccui/components/BreadcrumbItem/index.vue?raw'
import ButtonIndex from '../ccui/components/Button/index.vue?raw'
import CardIndex from '../ccui/components/Card/index.vue?raw'
import CascaderIndex from '../ccui/components/Cascader/index.vue?raw'
import CheckboxButton from '../ccui/components/Checkbox/Button.vue?raw'
import CheckboxGroup from '../ccui/components/Checkbox/Group.vue?raw'
import CheckboxIndex from '../ccui/components/Checkbox/index.vue?raw'
import CollapseIndex from '../ccui/components/Collapse/index.vue?raw'
import CollapseItemIndex from '../ccui/components/CollapseItem/index.vue?raw'
import ColorIndex from '../ccui/components/Color/index.vue?raw'
import ColorPickerIndex from '../ccui/components/ColorPicker/index.vue?raw'
import ContainerAside from '../ccui/components/Container/Aside.vue?raw'
import ContainerFooter from '../ccui/components/Container/Footer.vue?raw'
import ContainerHeader from '../ccui/components/Container/Header.vue?raw'
import ContainerIndex from '../ccui/components/Container/index.vue?raw'
import ContainerMain from '../ccui/components/Container/Main.vue?raw'
import DatePickerIndex from '../ccui/components/DatePicker/index.vue?raw'
import DateTimePickerIndex from '../ccui/components/DateTimePicker/index.vue?raw'
import DescriptionsIndex from '../ccui/components/Descriptions/index.vue?raw'
import DescriptionsItemIndex from '../ccui/components/DescriptionsItem/index.vue?raw'
import DialogIndex from '../ccui/components/Dialog/index.vue?raw'
import DividerIndex from '../ccui/components/Divider/index.vue?raw'
import DrawerIndex from '../ccui/components/Drawer/index.vue?raw'
import DropdownIndex from '../ccui/components/Dropdown/index.vue?raw'
import EllipsisIndex from '../ccui/components/Ellipsis/index.vue?raw'
import FormIndex from '../ccui/components/Form/index.vue?raw'
import FormItemIndex from '../ccui/components/FormItem/index.vue?raw'
import IconIndex from '../ccui/components/Icon/index.vue?raw'
import ImageIndex from '../ccui/components/Image/index.vue?raw'
import InputIndex from '../ccui/components/Input/index.vue?raw'
import InputNumberIndex from '../ccui/components/InputNumber/index.vue?raw'
import InputTagIndex from '../ccui/components/InputTag/index.vue?raw'
import LayoutCol from '../ccui/components/Layout/Col.vue?raw'
import LayoutRow from '../ccui/components/Layout/Row.vue?raw'
import LinkIndex from '../ccui/components/Link/index.vue?raw'
import MenuIndex from '../ccui/components/Menu/index.vue?raw'
import MenuItem from '../ccui/components/Menu/MenuItem.vue?raw'
import MenuItemGroup from '../ccui/components/Menu/MenuItemGroup.vue?raw'
import SubMenu from '../ccui/components/Menu/SubMenu.vue?raw'
import MentionIndex from '../ccui/components/Mention/index.vue?raw'
import MessageIndex from '../ccui/components/Message/index.vue?raw'
import MessageBoxIndex from '../ccui/components/MessageBox/index.vue?raw'
import OptionIndex from '../ccui/components/Option/index.vue?raw'
import OptionGroupIndex from '../ccui/components/OptionGroup/index.vue?raw'
import PageHeaderIndex from '../ccui/components/PageHeader/index.vue?raw'
import PaginationIndex from '../ccui/components/Pagination/index.vue?raw'
import PopconfirmIndex from '../ccui/components/Popconfirm/index.vue?raw'
import PopoverIndex from '../ccui/components/Popover/index.vue?raw'
import RadioIndex from '../ccui/components/Radio/index.vue?raw'
import RateIndex from '../ccui/components/Rate/index.vue?raw'
import ResultIndex from '../ccui/components/Result/index.vue?raw'
import ScrollbarIndex from '../ccui/components/Scrollbar/index.vue?raw'
import SegmentedIndex from '../ccui/components/Segmented/index.vue?raw'
import SelectIndex from '../ccui/components/Select/index.vue?raw'
import SliderIndex from '../ccui/components/Slider/index.vue?raw'
import SpaceIndex from '../ccui/components/Space/index.vue?raw'
import StatisticIndex from '../ccui/components/Statistic/index.vue?raw'
import StepIndex from '../ccui/components/Step/index.vue?raw'
import StepsIndex from '../ccui/components/Steps/index.vue?raw'
import SwitchIndex from '../ccui/components/Switch/index.vue?raw'
import TabPaneIndex from '../ccui/components/TabPane/index.vue?raw'
import TableIndex from '../ccui/components/Table/index.vue?raw'
import TabsIndex from '../ccui/components/Tabs/index.vue?raw'
import TagIndex from '../ccui/components/Tag/index.vue?raw'
import TimePickerIndex from '../ccui/components/TimePicker/index.vue?raw'
import TimeSelectIndex from '../ccui/components/TimeSelect/index.vue?raw'
import TooltipIndex from '../ccui/components/Tooltip/index.vue?raw'
import TransferIndex from '../ccui/components/Transfer/index.vue?raw'
import TreeIndex from '../ccui/components/Tree/index.vue?raw'
import TreeSelectIndex from '../ccui/components/TreeSelect/index.vue?raw'
import TypographyIndex from '../ccui/components/Typography/index.vue?raw'
import TypographyLink from '../ccui/components/Typography/Link.vue?raw'
import TypographyParagraph from '../ccui/components/Typography/Paragraph.vue?raw'
import TypographyText from '../ccui/components/Typography/Text.vue?raw'
import TypographyTitle from '../ccui/components/Typography/Title.vue?raw'
import UploadIndex from '../ccui/components/Upload/index.vue?raw'
import VirtualizedSelectIndex from '../ccui/components/VirtualizedSelect/index.vue?raw'

import TokensCss from '../ccui/theme/tokens.css?raw'

export const CCUI_THEME_FILES: { path: string; name: string; content: string }[] = [
  { path: 'ccui/theme/tokens.css', name: 'tokens.css', content: TokensCss },
]

export const CCUI_COMPONENT_FILES: { path: string; name: string; content: string }[] = [
  { path: 'ccui/Affix.vue', name: 'Affix.vue', content: AffixIndex },
  { path: 'ccui/Anchor.vue', name: 'Anchor.vue', content: AnchorIndex },
  { path: 'ccui/Autocomplete.vue', name: 'Autocomplete.vue', content: AutocompleteIndex },
  { path: 'ccui/Avatar.vue', name: 'Avatar.vue', content: AvatarIndex },
  { path: 'ccui/Backtop.vue', name: 'Backtop.vue', content: BacktopIndex },
  { path: 'ccui/Border.vue', name: 'Border.vue', content: BorderIndex },
  { path: 'ccui/Breadcrumb.vue', name: 'Breadcrumb.vue', content: BreadcrumbIndex },
  { path: 'ccui/BreadcrumbItem.vue', name: 'BreadcrumbItem.vue', content: BreadcrumbItemIndex },
  { path: 'ccui/Button.vue', name: 'Button.vue', content: ButtonIndex },
  { path: 'ccui/Card.vue', name: 'Card.vue', content: CardIndex },
  { path: 'ccui/Cascader.vue', name: 'Cascader.vue', content: CascaderIndex },
  { path: 'ccui/Checkbox.vue', name: 'Checkbox.vue', content: CheckboxIndex },
  { path: 'ccui/CheckboxButton.vue', name: 'CheckboxButton.vue', content: CheckboxButton },
  { path: 'ccui/CheckboxGroup.vue', name: 'CheckboxGroup.vue', content: CheckboxGroup },
  { path: 'ccui/Collapse.vue', name: 'Collapse.vue', content: CollapseIndex },
  { path: 'ccui/CollapseItem.vue', name: 'CollapseItem.vue', content: CollapseItemIndex },
  { path: 'ccui/Color.vue', name: 'Color.vue', content: ColorIndex },
  { path: 'ccui/ColorPicker.vue', name: 'ColorPicker.vue', content: ColorPickerIndex },
  { path: 'ccui/Container.vue', name: 'Container.vue', content: ContainerIndex },
  { path: 'ccui/ContainerAside.vue', name: 'ContainerAside.vue', content: ContainerAside },
  { path: 'ccui/ContainerFooter.vue', name: 'ContainerFooter.vue', content: ContainerFooter },
  { path: 'ccui/ContainerHeader.vue', name: 'ContainerHeader.vue', content: ContainerHeader },
  { path: 'ccui/ContainerMain.vue', name: 'ContainerMain.vue', content: ContainerMain },
  { path: 'ccui/DatePicker.vue', name: 'DatePicker.vue', content: DatePickerIndex },
  { path: 'ccui/DateTimePicker.vue', name: 'DateTimePicker.vue', content: DateTimePickerIndex },
  { path: 'ccui/Descriptions.vue', name: 'Descriptions.vue', content: DescriptionsIndex },
  { path: 'ccui/DescriptionsItem.vue', name: 'DescriptionsItem.vue', content: DescriptionsItemIndex },
  { path: 'ccui/Dialog.vue', name: 'Dialog.vue', content: DialogIndex },
  { path: 'ccui/Divider.vue', name: 'Divider.vue', content: DividerIndex },
  { path: 'ccui/Drawer.vue', name: 'Drawer.vue', content: DrawerIndex },
  { path: 'ccui/Dropdown.vue', name: 'Dropdown.vue', content: DropdownIndex },
  { path: 'ccui/Ellipsis.vue', name: 'Ellipsis.vue', content: EllipsisIndex },
  { path: 'ccui/Form.vue', name: 'Form.vue', content: FormIndex },
  { path: 'ccui/FormItem.vue', name: 'FormItem.vue', content: FormItemIndex },
  { path: 'ccui/Icon.vue', name: 'Icon.vue', content: IconIndex },
  { path: 'ccui/Image.vue', name: 'Image.vue', content: ImageIndex },
  { path: 'ccui/Input.vue', name: 'Input.vue', content: InputIndex },
  { path: 'ccui/InputNumber.vue', name: 'InputNumber.vue', content: InputNumberIndex },
  { path: 'ccui/InputTag.vue', name: 'InputTag.vue', content: InputTagIndex },
  { path: 'ccui/Row.vue', name: 'Row.vue', content: LayoutRow },
  { path: 'ccui/Col.vue', name: 'Col.vue', content: LayoutCol },
  { path: 'ccui/Link.vue', name: 'Link.vue', content: LinkIndex },
  { path: 'ccui/Menu.vue', name: 'Menu.vue', content: MenuIndex },
  { path: 'ccui/MenuItem.vue', name: 'MenuItem.vue', content: MenuItem },
  { path: 'ccui/MenuItemGroup.vue', name: 'MenuItemGroup.vue', content: MenuItemGroup },
  { path: 'ccui/SubMenu.vue', name: 'SubMenu.vue', content: SubMenu },
  { path: 'ccui/Mention.vue', name: 'Mention.vue', content: MentionIndex },
  { path: 'ccui/Message.vue', name: 'Message.vue', content: MessageIndex },
  { path: 'ccui/MessageBox.vue', name: 'MessageBox.vue', content: MessageBoxIndex },
  { path: 'ccui/Option.vue', name: 'Option.vue', content: OptionIndex },
  { path: 'ccui/OptionGroup.vue', name: 'OptionGroup.vue', content: OptionGroupIndex },
  { path: 'ccui/PageHeader.vue', name: 'PageHeader.vue', content: PageHeaderIndex },
  { path: 'ccui/Pagination.vue', name: 'Pagination.vue', content: PaginationIndex },
  { path: 'ccui/Popconfirm.vue', name: 'Popconfirm.vue', content: PopconfirmIndex },
  { path: 'ccui/Popover.vue', name: 'Popover.vue', content: PopoverIndex },
  { path: 'ccui/Radio.vue', name: 'Radio.vue', content: RadioIndex },
  { path: 'ccui/Rate.vue', name: 'Rate.vue', content: RateIndex },
  { path: 'ccui/Result.vue', name: 'Result.vue', content: ResultIndex },
  { path: 'ccui/Scrollbar.vue', name: 'Scrollbar.vue', content: ScrollbarIndex },
  { path: 'ccui/Segmented.vue', name: 'Segmented.vue', content: SegmentedIndex },
  { path: 'ccui/Select.vue', name: 'Select.vue', content: SelectIndex },
  { path: 'ccui/Slider.vue', name: 'Slider.vue', content: SliderIndex },
  { path: 'ccui/Space.vue', name: 'Space.vue', content: SpaceIndex },
  { path: 'ccui/Statistic.vue', name: 'Statistic.vue', content: StatisticIndex },
  { path: 'ccui/Step.vue', name: 'Step.vue', content: StepIndex },
  { path: 'ccui/Steps.vue', name: 'Steps.vue', content: StepsIndex },
  { path: 'ccui/Switch.vue', name: 'Switch.vue', content: SwitchIndex },
  { path: 'ccui/TabPane.vue', name: 'TabPane.vue', content: TabPaneIndex },
  { path: 'ccui/Table.vue', name: 'Table.vue', content: TableIndex },
  { path: 'ccui/Tabs.vue', name: 'Tabs.vue', content: TabsIndex },
  { path: 'ccui/Tag.vue', name: 'Tag.vue', content: TagIndex },
  { path: 'ccui/TimePicker.vue', name: 'TimePicker.vue', content: TimePickerIndex },
  { path: 'ccui/TimeSelect.vue', name: 'TimeSelect.vue', content: TimeSelectIndex },
  { path: 'ccui/Tooltip.vue', name: 'Tooltip.vue', content: TooltipIndex },
  { path: 'ccui/Transfer.vue', name: 'Transfer.vue', content: TransferIndex },
  { path: 'ccui/Tree.vue', name: 'Tree.vue', content: TreeIndex },
  { path: 'ccui/TreeSelect.vue', name: 'TreeSelect.vue', content: TreeSelectIndex },
  { path: 'ccui/Typography.vue', name: 'Typography.vue', content: TypographyIndex },
  { path: 'ccui/TypographyLink.vue', name: 'TypographyLink.vue', content: TypographyLink },
  { path: 'ccui/TypographyParagraph.vue', name: 'TypographyParagraph.vue', content: TypographyParagraph },
  { path: 'ccui/TypographyText.vue', name: 'TypographyText.vue', content: TypographyText },
  { path: 'ccui/TypographyTitle.vue', name: 'TypographyTitle.vue', content: TypographyTitle },
  { path: 'ccui/Upload.vue', name: 'Upload.vue', content: UploadIndex },
  { path: 'ccui/VirtualizedSelect.vue', name: 'VirtualizedSelect.vue', content: VirtualizedSelectIndex },
]

export function getCcuiComponentsAsProjectFiles(): ProjectFile[] {
  const ccuiFolder: ProjectFile = {
    id: 'ccui-folder',
    name: 'ccui',
    path: '/src/ccui',
    type: 'folder',
    children: CCUI_COMPONENT_FILES.map((file, index) => ({
      id: `ccui-${index}`,
      name: file.name,
      path: `/src/${file.path}`,
      type: 'file' as const,
      language: 'vue' as const,
      content: file.content,
      readonly: true,
    })),
  }

  return [ccuiFolder]
}

export function getCcuiThemeAsProjectFiles(): ProjectFile[] {
  const themeFolder: ProjectFile = {
    id: 'ccui-theme-folder',
    name: 'theme',
    path: '/src/ccui/theme',
    type: 'folder',
    children: CCUI_THEME_FILES.map((file, index) => ({
      id: `ccui-theme-${index}`,
      name: file.name,
      path: `/src/${file.path}`,
      type: 'file' as const,
      language: 'css' as const,
      content: file.content,
      readonly: true,
    })),
  }

  return [themeFolder]
}
