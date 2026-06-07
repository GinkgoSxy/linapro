# Tasks

## Summary

- [x] 建立插件框架核心能力：统一`plugin.yaml`、源码/动态插件生命周期、动态`WASM`运行时、host service、能力目录、插件 UI、菜单权限、启动引导、依赖、升级、工作区和包边界。
- [x] 建立插件宿主领域能力模型：`usercap`、`authzcap`、`dictcap`、`filecap`、`sessioncap`、`configcap`、`notifycap`、`plugincap`、`jobcap`、`infracap`，重整`orgcap`、`tenantcap`和`ai`；清零插件生产代码对宿主`sys_*`核心表的直接依赖；动态`data`服务收窄为当前插件自有表。
- [x] 统一能力组件为`*cap`命名体系：删除`capability/contract`聚合包；认证授权收敛到`authcap`能力族；插件自能力收口到`plugincap`子领域；租户过滤归属`tenantcap`；动态插件数据 SDK 收口到`recordstore`。
- [x] 统一插件资源读取为`Manifest()`：删除旧`Metadata`服务语义；`Manifest()`覆盖`manifest/`下完整资源包括`config/`、`sql/`、`i18n/`；动态 artifact 资源视图完整投影；动态插件构建器完整收集 manifest 资源。
- [x] 移除源码插件宿主配置读取 key 白名单限制，保持动态插件授权快照约束。
- [x] 优化插件运行时复杂度：runtime state 列表批量读取 manifest；WASM host service 依赖显式注入；runtime wiring 必需依赖构造阶段校验；host service 协议单一描述源和覆盖测试。
- [x] 优化插件管理首次加载：列表拆分为分页摘要 DTO 和详情 DTO；cron 和依赖检查移出列表路径；前端弹窗按需异步加载；缓存复用`plugin-runtime`协调。
- [x] 整理插件服务内部文件组织：合并同职责低行数文件；测试按被测职责拆分；helper 收敛到支撑文件。
- [x] 修复和收敛关键演进：源码插件自动安装后同步启动快照；旧`Can*`/guard 生命周期替换为`Before*`/`After*`；动态生命周期由构建期自动发现；插件 API 与资产路径分别收敛到`/x/{plugin-id}/api/v1/...`和`/x-assets/{plugin-id}/{version}/...`。
- [x] 治理：插件公共契约收敛到`pkg/plugin`；宿主私有实现收敛到`internal/service/plugin`；能力目录不暴露`DAO`、`DO`、`Entity`、`*gdb.Model`、`*ghttp.Request`、写入路径或数据权限注入能力。
- [x] 性能：插件列表查询保持只读且使用分页摘要；完整治理读模型可预热并按插件生命周期、动态产物和租户供应策略显式失效；列表装配复用快照并避免逐插件重复扫描。
- [x] 一致性：插件运行时、frontend bundle、runtime i18n、WASM、manifest 资源视图和默认配置视图按插件和资源作用域失效；集群模式通过 coordination revision/event 和 per-plugin 锁收敛。

## Feedback

- [x] FB-1: 收敛`Services`公开领域能力目录，移除通知、会话和配置领域的重复公开入口。根因：`capability.Services`同时公开旧入口和新领域入口。修复：删除旧`contract.NotifyService`与`contract.SessionService`，统一使用`Services.Notifications()`、`Services.Sessions()`、`Services.Plugins().Config()`和`Services.HostConfig()`。验证：Go 编译门禁、静态检索和 OpenSpec 严格校验通过。
- [x] FB-2: 通用化插件规范检查入口并移除 Go 语法已阻断的宿主`DAO/DO/Entity`扫描。根因：原扫描器将 Go `internal`目录天然阻断的导入也纳入规则。修复：删除重复规则，公开命令改为`linactl plugins.check`。验证：`go test ./hack/tools/linactl/...`通过。
- [x] FB-3: 公开动态插件语言无关`hostServices`协议目录。根因：开发者无法查看可声明服务、方法与资源边界。修复：新增`pluginbridge/protocol/hostservice_catalog.go`公开协议描述。验证：协议测试通过。
- [x] FB-4: 将动态插件 guest 能力 SDK 合并到`pluginbridge/guest`。根因：`capability/guest`和`pluginbridge/guest`两个包名都叫`guest`造成混淆。修复：删除`capability/guest`目录，合并到`pluginbridge/guest`。验证：Go 测试、治理扫描和`wasip1`构建通过。
- [x] FB-5: 将认证 token 与授权能力收敛到`authcap`能力族子领域。根因：旧结构在根`capability.Services`同时暴露`Auth()`和`Authz()`。修复：token 契约迁移到`authcap/token`，授权迁移到`authcap/authz`，根只暴露`Auth()`。验证：Go 测试和静态检索通过。
- [x] FB-6: 将动态插件受治理数据 SDK 从`capability/data`重命名为`capability/recordstore`。根因：`data`命名过宽。修复：迁移为`recordstore`，Go 入口改为`RecordStore()`。验证：Go 测试和 OpenSpec 严格校验通过。
- [x] FB-7: 将过轻`pkg/authtoken`公共包合并到`authcap/token`子领域。根因：单独保留形成过轻公共包。修复：合并到`authcap/token`。验证：Go 测试和静态检索通过。
- [x] FB-8: 将`hostservices_domain_adapters.go`中的领域适配器实现拆分到各自`*cap`内部组件。根因：单文件聚合跨领域实现。修复：拆分为`hostservices/internal/{authzcap,configcap,...}`组件包。验证：Go 测试通过。
- [x] FB-9: 修复根插件服务测试文件缺少对应生产源码文件的问题。根因：测试命名与生产文件不对应。修复：新增对应生产文件，测试归位。验证：Go 测试通过。
- [x] FB-10: `linapro-demo-dynamic`缺少`service: manifest`配置示例。根因：动态插件示例未展示 manifest 授权写法。修复：更新`plugin.yaml`和文档。验证：YAML 解析、OpenSpec 校验和构建测试通过。
- [x] FB-11: `linapro-demo-dynamic`的 manifest 示例授权过宽。根因：示例授权范围过宽且缺少声明到使用的闭环。修复：收敛授权路径，新增演示接口和页面。验证：Go 测试、TypeScript 编译和 E2E 治理校验通过。
- [x] FB-12: Nightly plugin-full E2E 复用旧动态插件 active release 导致 manifest 配置预览缺失。根因：E2E 未强制重新安装当前构建产物。修复：测试前强制卸载旧 active release 后重新安装。验证：TypeScript 编译和 E2E 治理校验通过。
- [x] FB-13: GitHub Actions clean checkout 缺少被忽略的动态插件 manifest 配置 fixture。根因：`config.yaml`被`.gitignore`忽略。修复：测试前从`config.example.yaml`临时复制生成 fixture。验证：Playwright 测试通过。
- [x] FB-14: 源码插件读取宿主配置被公开 key 白名单错误限制。根因：`valueForKey`通过固定 switch 只允许三个 key。修复：移除固定白名单，按调用方 key 直接读取。验证：Go 测试和 OpenSpec 校验通过。
- [x] FB-15: 动态插件构建器仍沿用旧的 manifest 资源过滤逻辑。根因：`collectManifestResources`只打包少量 YAML 资源。修复：完整收集`manifest/`下实际文件。验证：构建器测试和产物静态检查通过。

## Verification

- [x] `openspec validate`严格校验：所有迭代均通过。
- [x] Go 编译门禁：覆盖`apps/lina-core/pkg/plugin/capability`、`pluginhost`、`pluginbridge`、受影响宿主领域 service、动态 host service 和所有迁移插件后端包。
- [x] 后端单元测试：领域能力单元测试、动态协议测试、`data`服务授权测试、缓存一致性测试、治理扫描测试。
- [x] 前端验证：TypeScript 类型检查、`pnpm i18n:check`通过。
- [x] E2E：完整 E2E 合计 582 passed、8 skipped、0 failed。
- [x] 静态检索：旧`contract.*Service`、旧非`*cap`包、旧`capability/ai`、旧`Metadata`服务、宿主核心表 DAO 生产导入均无残留。
- [x] `git diff --check`：所有迭代均通过。

## Governance

- [x] i18n：领域能力返回稳定值和`labelKey`；`make i18n.check`通过；插件运行时文案按宿主和插件 i18n 启用边界维护。
- [x] 缓存一致性：权限、角色关系、租户成员、插件状态、字典、组织树、运行时配置等关键数据使用共享修订号和事务后失效；单机和集群模式均有覆盖。
- [x] 数据权限：读取、候选、批量、树形、导出和聚合路径均按领域能力边界在查询阶段接入租户与数据权限；批量读取以`MissingIDs`隐藏不存在与不可见差异。
- [x] DI 来源：缓存敏感服务复用启动期共享实例或共享后端；WASM host service 和 runtime 依赖显式注入；未在业务路径临时`New()`关键服务图。
- [x] 跨平台：治理扫描和 WASM 构建均使用 Go 工具链或`linactl`内部组件实现；根`Makefile`和`make.cmd`仅作为薄包装入口。
- [x] 测试覆盖：后端单元测试、前端类型检查、插件管理与动态插件 E2E、host-only/plugin-full 构建测试、WASM 构建、静态扫描、OpenSpec 校验和发布链路验证。
