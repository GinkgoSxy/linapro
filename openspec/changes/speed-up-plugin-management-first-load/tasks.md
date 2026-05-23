## 1. 实现任务

- [x] 1.1 补齐插件管理首屏性能优化 OpenSpec 文档，明确列表不瘦身、缓存一致性、i18n 和数据权限边界。
- [x] 1.2 在插件列表构建和依赖检查中复用同一次请求的 manifest 扫描结果，避免列表中每个插件重复扫描清单和动态 artifact。
- [x] 1.3 新增插件管理完整列表读模型缓存，并让 `List` 在过滤前复用该缓存。
- [x] 1.4 在 HTTP runtime 启动完成后异步预热插件管理列表读模型，预热失败只记录日志并允许请求回退同步构建。
- [x] 1.5 将插件同步、上传、安装、卸载、启用、禁用、源码升级、动态升级和租户供应策略更新接入列表读模型失效。
- [x] 1.6 增加或更新后端单元测试，覆盖请求内扫描复用、缓存命中、失效后重建和启动预热入口。
- [x] 1.7 运行相关 Go 包测试、宿主启动绑定包测试、OpenSpec 严格校验和空白检查，并执行 `lina-review` 审查。

## 2. 执行记录

- i18n 影响评估：本变更不新增或修改运行时前端语言包、宿主 `manifest/i18n`、`apidoc i18n`、菜单、路由、按钮、表单或插件清单文案；插件 i18n 缓存仍由既有插件运行时失效逻辑处理；插件管理列表读模型按请求 locale 与 runtime bundle version 分桶缓存，避免启动预热、其他语言请求或同语言翻译包失效污染本地化插件名称与描述。
- 数据权限影响评估：本变更不新增或修改业务数据操作接口，插件管理列表仍为既有平台治理查询；不会扩大数据读取范围或绕过角色数据权限。
- 缓存一致性影响评估：新增插件管理列表读模型缓存，权威数据源为插件 manifest、动态 artifact、插件治理表、发布快照、资源引用、菜单/权限投影和插件声明；单机模式使用进程内缓存与生命周期本地失效，集群模式复用插件运行时共享修订号跨实例失效，读路径先刷新本地运行时缓存后读取列表缓存；最大可接受陈旧窗口为本节点下一次生命周期失效或集群下一次修订刷新，失效操作可重复执行。
- 开发工具跨平台影响评估：本变更不修改开发工具、脚本、构建入口、测试入口或 CI 辅助命令。
- 列表瘦身边界：本次未拆分插件管理列表字段，仍保留弹窗所需的依赖检查、host service、route review、mock data 和运行时升级投影，避免把耗时转移到弹窗打开链路。
- 已执行测试：`cd apps/lina-core && go test ./internal/service/plugin -run 'Test(DependencySnapshotCacheReusesCatalogSnapshot|ManagementListCacheAvoidsRepeatedManifestScans|RuntimeCacheChangeInvalidatesManagementList|PrewarmManagementListPopulatesCache|ManagementListCacheIsLocaleScoped|UpgradeSourcePluginBeforeCallbackVetoes)' -count=1` 通过。
- 已执行测试：`cd apps/lina-core && go test ./internal/service/plugin -count=1` 通过。
- 已执行测试：`cd apps/lina-core && go test ./internal/cmd -count=1` 通过。
- 已执行验证：`openspec validate speed-up-plugin-management-first-load --strict` 通过。
- 已执行验证：`git diff --check -- apps/lina-core/internal/service/plugin apps/lina-core/internal/cmd/cmd_http_runtime.go openspec/changes/speed-up-plugin-management-first-load` 通过。

## Feedback

- [x] **FB-1**: 启动异步插件管理列表预热需要通过 debug 日志打印预热耗时

## Feedback 执行记录

- FB-1 影响分析：修改 `apps/lina-core/internal/cmd/cmd_http_runtime.go` 的启动异步插件管理列表预热入口，以及 `apps/lina-core/internal/cmd/cmd_http_routes.go` 的启动动态前端 bundle 预热入口，仅新增 debug 级耗时日志；不改变预热失败降级策略、插件列表 API、缓存权威数据源或跨实例失效语义。
- FB-1 自动化测试：新增 `TestStartHTTPPluginManagementListPrewarmLogsDebugDuration` 和 `TestPrewarmHTTPRuntimeFrontendBundlesLogsDebugDuration`，覆盖预热成功与失败时均输出包含 `duration=` 的 debug 日志。
- FB-1 已执行测试：`cd apps/lina-core && go test ./internal/cmd -run 'Test(StartHTTPPluginManagementListPrewarmLogsDebugDuration|PrewarmHTTPRuntimeFrontendBundlesLogsDebugDuration)' -count=1` 通过。
- FB-1 已执行测试：`cd apps/lina-core && go test ./internal/cmd -count=1` 通过。
- FB-1 已执行测试：`cd apps/lina-core && go test ./internal/service/plugin -count=1` 通过。
- FB-1 已执行验证：`openspec validate speed-up-plugin-management-first-load --strict` 通过。
- FB-1 已执行验证：`git diff --check -- apps/lina-core/internal/cmd/cmd_http_runtime.go apps/lina-core/internal/cmd/cmd_http_routes.go apps/lina-core/internal/cmd/cmd_test.go openspec/changes/speed-up-plugin-management-first-load/tasks.md` 通过。
- FB-1 审查结论：已执行 `lina-review`；本次反馈仅新增启动期插件预热 debug 耗时日志与对应单元测试，不新增 API、SQL、i18n 资源、开发工具脚本或数据操作接口；日志继续使用启动上下文或 detached 启动上下文，未发现阻断问题。
