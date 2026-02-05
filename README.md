## hyper-designer

## opencode 插件

主实现和opencode具体插件入口分离，做到和工具解耦，便于后续迁移。主程序实现了agent、agent提示词的动态组装、skill等。

`opencode/.plugins/hyper-designer.ts` 软连接放到 `~/.config/encode/.plugins/` 目录下即可启用该插件。主目录放到 `~/.config/encode/` 目录下，这样 `.plugins` 的插件能够访问主目录的具体实现。插件功能包括：

* 获取可用的工具
* 生成agent到opencode中