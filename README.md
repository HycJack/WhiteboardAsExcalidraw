# Excalidraw Whiteboard

一个基于 React + TypeScript 构建的在线白板绘图应用，支持手绘风格的图形绘制。

## 功能特性

### 绘图工具

| 工具 | 快捷键 | 描述 |
|------|--------|------|
| 选择 | `V` | 选择、移动、调整图形大小 |
| 矩形 | `R` | 绘制矩形 |
| 椭圆 | `O` | 绘制椭圆 |
| 菱形 | `D` | 绘制菱形 |
| 箭头 | `A` | 绘制箭头 |
| 直线 | `L` | 绘制直线 |
| 自由绘制 | `P` | 自由手绘 |
| 文本 | `T` | 添加文本 |
| 星形 | - | 绘制五角星 |
| 三角形 | - | 绘制三角形 |
| 心形 | - | 绘制心形 |

### 属性编辑

选中图形后，可通过左侧属性面板调整：

- **线条颜色** - 9 种预设颜色
- **填充颜色** - 9 种预设颜色（含透明）
- **线条粗细** - 细/中/粗 三档
- **线条样式** - 实线/虚线/点线
- **填充样式** - 无/影线/纯色/锯齿/网格
- **粗糙度** - 0-3 可调，控制手绘风格程度
- **不透明度** - 10%-100% 可调

### 画布操作

- **缩放** - 鼠标滚轮或底部控制栏（10%-500%）
- **平移** - 按住 `Space` + 拖动 或 鼠标中键拖动
- **撤销/重做** - `Ctrl+Z` / `Ctrl+Shift+Z`
- **导出 PNG** - 点击右上角导出按钮
- **清空画布** - 点击右上角清空按钮

### 元素操作

- **选择** - 点击图形选中，`Shift+点击` 多选
- **移动** - 选中后拖动移动
- **调整大小** - 拖动 8 个控制点调整尺寸
- **删除** - 选中后按 `Delete` 或 `Backspace`

## 技术栈

- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui + Radix UI
- **绘图引擎**: RoughJS（手绘风格）
- **状态管理**: React Context + useReducer

## 项目结构

```
src/
├── components/
│   ├── Canvas.tsx          # 画布组件，处理绑定和渲染
│   ├── Toolbar.tsx         # 顶部工具栏
│   ├── PropertiesPanel.tsx # 左侧属性面板
│   ├── BottomControls.tsx  # 底部控制栏（缩放、撤销重做）
│   └── ErrorBoundary.tsx   # 错误边界
├── store/
│   └── index.tsx           # 全局状态管理
├── types/
│   └── index.ts            # TypeScript 类型定义
├── utils/
│   └── shapes.ts           # 自定义图形注册表
├── hooks/
│   └── use-mobile.tsx      # 移动端检测 Hook
├── App.tsx                 # 根组件
├── main.tsx                # 入口文件
└── index.css               # 全局样式
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm（推荐）

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 核心实现

### 状态管理

采用 React Context + useReducer 实现全局状态管理，支持以下操作：

- 工具切换
- 元素增删改查
- 属性设置（颜色、线宽、样式等）
- 视图变换（缩放、平移）
- 历史记录（撤销/重做）

### 绘图引擎

使用 RoughJS 实现手绘风格图形渲染，支持：

- 矩形、椭圆、菱形等基础图形
- 直线、箭头、自由绘制
- 可扩展的自定义图形系统
- 多种填充样式（影线、锯齿、网格等）

### 自定义图形

通过 `ShapeRegistry` 可注册自定义图形：

```typescript
ShapeRegistry.register('custom', {
  name: '自定义图形',
  icon: '◆',
  renderer: (rc, element, options) => {
    // 渲染逻辑
  },
  hitTest: (element, x, y) => {
    // 点击测试逻辑
    return true;
  }
});
```

## 浏览器支持

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

## License

MIT
