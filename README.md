# 赵正意的个人网站

这是一个使用原生 HTML、CSS 和 JavaScript 构建的个人网站，可直接部署到 GitHub Pages，无需构建工具。

## 网站内容

- 首页：个人介绍、生活头像、近期作品入口和动态渐变交互
- 关于我：个人简介、经历时间线、兴趣爱好和联系方式
- 作品集：项目截图轮播、项目详情弹窗和作品入口
- 显示设置：浅色／深色模式，以及经典／抽象工业派风格
- 响应式布局：适配桌面端和移动端，并支持减少动态效果设置

## 项目结构

```text
.
├─ index.html
├─ about.html
├─ portfolio.html
├─ assets/
│  ├─ css/style.css
│  └─ js/main.js
└─ images/
   ├─ 生活头像.jpg
   └─ 证件照.jpg
```

## 本地查看

在项目目录中运行：

```powershell
python -m http.server 8000
```

然后在浏览器访问 `http://localhost:8000/`。

也可以直接打开 `index.html`，但使用本地服务器更接近 GitHub Pages 的实际访问方式。

## 更新内容

- 头像文件统一放在 `images/` 目录。
- 联系方式、经历和兴趣爱好在 `about.html` 中修改。
- 项目名称、介绍和标签在 `portfolio.html` 中修改。
- 添加作品截图时，将图片放入 `images/`，再替换项目卡片中的占位内容。

## 部署

仓库推送到 GitHub 后，可在仓库设置的 Pages 页面中选择从 `main` 分支根目录发布。
