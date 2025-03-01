---

title: 无障碍
description: Reka UI 遵循 WAI-ARIA 创作实践指南，并在各种现代浏览器和常用辅助技术中进行了测试。
---

# 无障碍
<Description>
Reka UI 遵循 WAI-ARIA 创作实践指南，并在各种现代浏览器和常用辅助技术中进行了测试。
</Description>

我们负责处理许多与辅助功能相关的困难实现细节，包括 `aria` 和 `role` 属性、焦点管理和键盘导航。这意味着用户应该能够在大多数情况下按原样使用我们的组件，并依赖功能来遵循预期的可访问性设计模式。

## WAI-ARIA

[WAI-ARIA](https://www.w3.org/TR/wai-aria-1.2/) 由 W3C 发布和维护，它指定了 Reka UI 中显示的许多常见 UI 模式的语义。这旨在为未使用浏览器提供的元素构建的控件提供含义。例如，如果使用 `div` 而不是 `button` 元素来创建按钮，则需要向 `div` 添加一些属性，以传达它是用于屏幕阅读器或语音识别工具的按钮。

除了语义之外，还有一些行为是来自不同类型的组件的预期。`button` 元素将以 `div` 不会的方式响应某些交互，因此开发人员需要使用 JavaScript 重新实现这些交互。[WAI-ARIA 创作实践](https://www.w3.org/TR/wai-aria-practices-1.2/)为实现 Reka UI 附带的各种控件的行为提供了额外的指导。

## 可访问的标签

借助许多内置表单控件，本机 HTML `label` 元素旨在为相应的 `input` 元素提供语义含义和上下文。对于非表单控件元素，或自定义控件（如 Reka UI 提供的控件），WAI-ARIA 提供了有关如何为这些控件提供辅助名称和描述的[规范](https://www.w3.org/TR/wai-aria-1.2/#namecalculation)。

在可能的情况下，Reka UI 包含抽象，以简化控件的标签。[`Label`](../components/label) primitive 旨在与我们的许多控件一起使用。最终，由您来提供这些标签，以便用户在导航应用程序时具有适当的上下文。

## 键盘导航

许多复杂的组件（如 [`Tabs`](../components/tabs) 和 [`Dialog`](../components/dialog)）都伴随着用户对如何使用键盘或其他非鼠标输入方式与其内容交互的期望。Reka UI 根据 [WAI-ARIA 创作实践](https://www.w3.org/TR/wai-aria-practices-1.2/)提供基本键盘支持。

## 焦点管理

正确的键盘导航和良好的标签通常与管理重点齐头并进。当用户与元素交互并且某些内容因此而发生变化时，将焦点与交互一起移动通常会很有帮助，以便下一个制表位（tab stop）是合乎逻辑的，具体取决于应用程序的新上下文。对于屏幕阅读器用户来说，移动焦点通常会导致公告来传达这种新的上下文，而这依赖于适当的标签。

在许多 Reka UI 中，我们根据用户通常在给定组件中进行的交互来移动焦点。例如，在 [`AlertDialog`](../components/alert-dialog) 中，当模式打开时，焦点以编程方式移动到 `Cancel` 按钮元素，以预期对提示的响应。
