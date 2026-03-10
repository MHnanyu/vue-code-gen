import type { ProjectFile } from '@/types'

import AffixIndex from '../ccui/components/Affix/index.vue?raw'
import AnchorIndex from '../ccui/components/Anchor/index.vue?raw'
import AutocompleteIndex from '../ccui/components/Autocomplete/index.vue?raw'
import BorderIndex from '../ccui/components/Border/index.vue?raw'
import ButtonIndex from '../ccui/components/Button/index.vue?raw'
import CascaderIndex from '../ccui/components/Cascader/index.vue?raw'
import CheckboxButton from '../ccui/components/Checkbox/Button.vue?raw'
import CheckboxGroup from '../ccui/components/Checkbox/Group.vue?raw'
import CheckboxIndex from '../ccui/components/Checkbox/index.vue?raw'
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
import DividerIndex from '../ccui/components/Divider/index.vue?raw'
import EllipsisIndex from '../ccui/components/Ellipsis/index.vue?raw'
import FormIndex from '../ccui/components/Form/index.vue?raw'
import FormItemIndex from '../ccui/components/FormItem/index.vue?raw'
import IconIndex from '../ccui/components/Icon/index.vue?raw'
import InputIndex from '../ccui/components/Input/index.vue?raw'
import InputNumberIndex from '../ccui/components/InputNumber/index.vue?raw'
import InputTagIndex from '../ccui/components/InputTag/index.vue?raw'
import LayoutCol from '../ccui/components/Layout/Col.vue?raw'
import LayoutRow from '../ccui/components/Layout/Row.vue?raw'
import LinkIndex from '../ccui/components/Link/index.vue?raw'
import MentionIndex from '../ccui/components/Mention/index.vue?raw'
import OptionIndex from '../ccui/components/Option/index.vue?raw'
import OptionGroupIndex from '../ccui/components/OptionGroup/index.vue?raw'
import RadioIndex from '../ccui/components/Radio/index.vue?raw'
import RateIndex from '../ccui/components/Rate/index.vue?raw'
import ResultIndex from '../ccui/components/Result/index.vue?raw'
import ScrollbarIndex from '../ccui/components/Scrollbar/index.vue?raw'
import SelectIndex from '../ccui/components/Select/index.vue?raw'
import SliderIndex from '../ccui/components/Slider/index.vue?raw'
import SpaceIndex from '../ccui/components/Space/index.vue?raw'
import SwitchIndex from '../ccui/components/Switch/index.vue?raw'
import TimePickerIndex from '../ccui/components/TimePicker/index.vue?raw'
import TimeSelectIndex from '../ccui/components/TimeSelect/index.vue?raw'
import TransferIndex from '../ccui/components/Transfer/index.vue?raw'
import TreeSelectIndex from '../ccui/components/TreeSelect/index.vue?raw'
import TypographyIndex from '../ccui/components/Typography/index.vue?raw'
import TypographyLink from '../ccui/components/Typography/Link.vue?raw'
import TypographyParagraph from '../ccui/components/Typography/Paragraph.vue?raw'
import TypographyText from '../ccui/components/Typography/Text.vue?raw'
import TypographyTitle from '../ccui/components/Typography/Title.vue?raw'
import UploadIndex from '../ccui/components/Upload/index.vue?raw'
import VirtualizedSelectIndex from '../ccui/components/VirtualizedSelect/index.vue?raw'

export const CCUI_COMPONENT_FILES: { path: string; name: string; content: string }[] = [
  { path: 'ccui/Affix.vue', name: 'Affix.vue', content: AffixIndex },
  { path: 'ccui/Anchor.vue', name: 'Anchor.vue', content: AnchorIndex },
  { path: 'ccui/Autocomplete.vue', name: 'Autocomplete.vue', content: AutocompleteIndex },
  { path: 'ccui/Border.vue', name: 'Border.vue', content: BorderIndex },
  { path: 'ccui/Button.vue', name: 'Button.vue', content: ButtonIndex },
  { path: 'ccui/Cascader.vue', name: 'Cascader.vue', content: CascaderIndex },
  { path: 'ccui/Checkbox.vue', name: 'Checkbox.vue', content: CheckboxIndex },
  { path: 'ccui/CheckboxButton.vue', name: 'CheckboxButton.vue', content: CheckboxButton },
  { path: 'ccui/CheckboxGroup.vue', name: 'CheckboxGroup.vue', content: CheckboxGroup },
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
  { path: 'ccui/Divider.vue', name: 'Divider.vue', content: DividerIndex },
  { path: 'ccui/Ellipsis.vue', name: 'Ellipsis.vue', content: EllipsisIndex },
  { path: 'ccui/Form.vue', name: 'Form.vue', content: FormIndex },
  { path: 'ccui/FormItem.vue', name: 'FormItem.vue', content: FormItemIndex },
  { path: 'ccui/Icon.vue', name: 'Icon.vue', content: IconIndex },
  { path: 'ccui/Input.vue', name: 'Input.vue', content: InputIndex },
  { path: 'ccui/InputNumber.vue', name: 'InputNumber.vue', content: InputNumberIndex },
  { path: 'ccui/InputTag.vue', name: 'InputTag.vue', content: InputTagIndex },
  { path: 'ccui/LayoutCol.vue', name: 'LayoutCol.vue', content: LayoutCol },
  { path: 'ccui/LayoutRow.vue', name: 'LayoutRow.vue', content: LayoutRow },
  { path: 'ccui/Link.vue', name: 'Link.vue', content: LinkIndex },
  { path: 'ccui/Mention.vue', name: 'Mention.vue', content: MentionIndex },
  { path: 'ccui/Option.vue', name: 'Option.vue', content: OptionIndex },
  { path: 'ccui/OptionGroup.vue', name: 'OptionGroup.vue', content: OptionGroupIndex },
  { path: 'ccui/Radio.vue', name: 'Radio.vue', content: RadioIndex },
  { path: 'ccui/Rate.vue', name: 'Rate.vue', content: RateIndex },
  { path: 'ccui/Result.vue', name: 'Result.vue', content: ResultIndex },
  { path: 'ccui/Scrollbar.vue', name: 'Scrollbar.vue', content: ScrollbarIndex },
  { path: 'ccui/Select.vue', name: 'Select.vue', content: SelectIndex },
  { path: 'ccui/Slider.vue', name: 'Slider.vue', content: SliderIndex },
  { path: 'ccui/Space.vue', name: 'Space.vue', content: SpaceIndex },
  { path: 'ccui/Switch.vue', name: 'Switch.vue', content: SwitchIndex },
  { path: 'ccui/TimePicker.vue', name: 'TimePicker.vue', content: TimePickerIndex },
  { path: 'ccui/TimeSelect.vue', name: 'TimeSelect.vue', content: TimeSelectIndex },
  { path: 'ccui/Transfer.vue', name: 'Transfer.vue', content: TransferIndex },
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
