## 为什么

LinaPro 需要一个稳定、可扩展且可治理的插件平台，使业务能力能够通过源码插件和动态插件持续交付，而不是反复侵入`apps/lina-core`核心宿主。插件平台必须同时覆盖清单契约、生命周期、动态`WASM`运行时、前后端集成、宿主服务授权、依赖与升级治理、启动自动化、包边界、多节点一致性、领域能力模型、能力组件治理、运行时复杂度治理、清单资源读取和管理页面性能，才能支撑"面向可持续交付的`AI`原生全栈框架"定位。

早期方案同时牵引了集群、发布、菜单、角色、认证、监控、`E2E`和开发工具等能力。压缩后的归档将插件框架自身作为长期历史 owner，只保留插件平台的核心演进和决策；其他能力只在设计文档中保留交叉影响摘要，当前契约以`openspec/specs/<capability>/spec.md`为准。

## 变更内容

- 建立统一插件契约，以`plugin.yaml`、源码插件目录和动态插件发布产物作为插件身份、资源、依赖、菜单、权限和生命周期的事实入口。
- 定义源码插件和动态插件生命周期，覆盖发现、安装、启用、禁用、卸载、升级、同版本刷新、租户级生命周期和失败诊断。生命周期回调统一使用`Before*`、`Upgrade`、`Uninstall`和`After*`命名，替代旧`Can*`或 guard 风格契约。
- 构建动态`WASM`插件运行时，包括自定义段解析、运行时资源视图、前端资产、动态路由、桥接协议、生命周期自动发现和执行资源边界。路由边界收敛到统一插件 API 命名空间`/x/{plugin-id}/api/v1/...`，公开资产收敛到`/x-assets/{plugin-id}/{version}/...`。
- 建立统一宿主服务模型，通过`hostServices`授权快照和`pkg/plugin/capability`能力目录向动态插件和源码插件暴露受治理的宿主能力。源码插件和动态插件共享同一能力语义，只允许 transport 不同。
- 建立插件宿主领域能力模型，覆盖`usercap`、`authzcap`、`dictcap`、`filecap`、`sessioncap`、`configcap`、`notifycap`、`plugincap`、`jobcap`、`infracap`，并重整`orgcap`、`tenantcap`和`ai`能力。插件不得直接生成或查询宿主核心`sys_*`表、宿主`DAO/DO/Entity`或私有缓存快照。
- 将插件公开能力组件统一为`*cap`命名体系，删除`capability/contract`作为具体能力聚合包的角色。认证 token 和授权能力收敛到`authcap`能力族子领域；插件自身配置、生命周期和状态收口到`plugincap`子领域；动态插件受治理数据 SDK 收口到`capability/recordstore`。
- 将插件资源读取统一为`Manifest()`，删除旧`Metadata`服务语义。`Manifest()`成为插件自有`manifest/`目录的只读原始资源视图，覆盖`config/`、`sql/`、`i18n/`等专用目录。源码插件可读取自身嵌入的完整`manifest/`资源；动态插件按`hostServices`授权快照读取 active release artifact 中的资源。
- 移除源码插件宿主配置读取的 key 白名单限制。源码插件可通过`HostServices.HostConfig()`读取任意宿主配置 key；动态插件仍受`hostServices`授权快照约束。
- 收敛插件公共包边界：`pluginhost`负责源码插件贡献，`pluginbridge`负责动态插件 ABI 与 transport，`capability`负责插件消费宿主能力。`pluginbridge`子组件按职责拆分，公开协议出口唯一；host service 协议样板由单一描述源覆盖。
- 优化插件运行时复杂度：runtime state 列表批量读取 manifest、WASM host service 依赖显式注入、runtime wiring 必需依赖构造阶段校验、host service 协议覆盖测试。
- 优化插件管理首次加载：列表拆分为分页摘要 DTO 和详情 DTO、cron 和依赖检查移出列表路径、前端弹窗按需异步加载、缓存复用`plugin-runtime`协调。
- 整理插件服务内部文件组织：合并同职责低行数文件、测试按被测职责拆分、helper 收敛到支撑文件。
- 引入`plugin.autoEnable`启动引导、事务性 mock data 安装、安装并启用快捷操作、插件依赖检查、运行时升级预览和显式升级执行。
- 支持官方插件工作区可选化和插件工作区管理命令，使宿主可在 host-only 与 plugin-full 模式下分别构建、测试和发布。

## Capabilities

### New Capabilities

- `plugin-manifest-lifecycle`：插件清单发现、生命周期资源同步、只读治理查询、SQL 资源分类、语言资源扩展和依赖声明识别。
- `plugin-runtime-loading`：动态插件运行时加载、WASM 自定义段解析、跨节点派生缓存失效、WASM 编译缓存、产物刷新一致性、协调器、保守隐藏策略和批量 manifest 读取。
- `plugin-host-service-extension`：动态插件版本化宿主服务协议、`CapabilityContext`、领域方法授权、安装授权模型、源码插件 hostservices 子组件和适配器复用。
- `plugin-capability-boundary-governance`：插件公共组件单一职责、internal 边界、插件间运行时调用接缝、能力公开面治理验证、领域能力语义共享和插件不得依赖宿主核心表实现。
- `plugin-package-boundary-governance`：`pkg/plugin`公共命名空间收敛、`pluginhost`/`pluginbridge`/`capability`职责分离、`*cap`组件包命名、公共原语包、旧包删除和包边界迁移。
- `pluginbridge-subcomponent-architecture`：`pluginbridge`子组件化拆分、依赖方向、协议行为不变、自动化验证、根包不发布业务能力 client 和公开协议出口唯一。
- `plugin-config-service`：插件配置服务通用只读配置访问、结构体扫描、插件作用域目录约定、宿主公开配置独立服务和源码插件不受 key 白名单限制。
- `plugin-data-service`：动态插件宿主数据服务、数据权限、原始 SQL 禁止、DAO/ORM 执行、DoCommit 拦截、受限 ORM SDK、枚举语义值和只访问当前插件自有表。
- `plugin-cache-service`：动态插件缓存服务、有损缓存语义、协调 KV backend、后端原生 TTL、原子递增、过期清理、源码插件缓存 facade。
- `plugin-lock-service`：动态插件锁服务、ticket/owner token 隔离。
- `plugin-network-service`：动态插件出站 HTTP、授权 URL 模式、default-deny。
- `plugin-notify-service`：动态插件通知服务、授权通道。
- `plugin-storage-service`：动态插件存储服务、逻辑存储空间。
- `plugin-hook-slot-extension`：宿主后端扩展点、前端 slot 扩展点、hook 执行顺序和标识符类型常量。
- `plugin-ui-integration`：插件页面多模式集成、前端资产托管、路由和 generation 感知、管理详情弹窗、安装并启用快捷操作、语言上下文参与、源码插件 HTTP 路由与工作台 UI 解耦、public asset 托管和管理页面摘要列表首屏。
- `plugin-embed-snapshot-packaging`：动态插件`go:embed`资源声明、构建器快照区段、目录扫描回退、构建产物输出目录和发布产物资源路径语义。
- `plugin-id-governance`：插件 ID 安全边界、官方插件 ID 规范化映射、运行时身份一致性和仓库治理扫描。
- `plugin-dependency-management`：插件依赖声明、结构化校验、安装前检查、卸载保护、API/UI 可见性、缓存一致性和框架能力消费不新增依赖配置块。
- `plugin-startup-bootstrap`：`plugin.autoEnable`结构化条目、启动引导执行顺序、集群模式分离、动态插件授权快照复用、UI 标记和启动快照同步。
- `plugin-mock-data-installation`：安装请求可选 mock-data 加载、事务一致性、失败信息、迁移账本分类、源码/动态共享机制和列表显示。
- `plugin-install-enable-shortcut`：安装弹窗安装并启用快捷操作。
- `plugin-runtime-upgrade`：插件运行时升级状态标记、业务入口受控、管理页升级操作、REST API、自定义升级回调、动态插件卸载回调、生命周期前置回调替代旧 Guard/Can*、缓存集群一致性和失败诊断。
- `plugin-upgrade-governance`：源码插件有效版本和发现版本分离、显式运行时升级、启动标记、治理资源同步、动态插件统一升级模型、依赖校验、反向依赖保护、失败保留旧发布和 provider 状态刷新。
- `plugin-workspace-management`：插件工作区 submodule 转普通目录、来源声明、安装、更新、状态检查和锁定状态。
- `official-plugin-workspace-decoupling`：官方插件工作区可选、编译期依赖解耦、工作区状态诊断和 host-only/plugin-full 验证分离。
- `framework-capability-registry`：框架能力按领域归属独立`*cap`组件、Provider Factory 声明、Provider 封装、消费 Service、冲突治理和缓存一致性。
- `workspace-route-boundary`：管理工作台入口可配置、保留命名空间优先、源码插件 HTTP 路由代码闭环、动态插件 API 统一命名空间。
- `plugin-api-query-performance`：插件列表查询无副作用、host-service 元数据查找避免模式探测。
- `plugin-permission-governance`：插件菜单和权限复用宿主体系、角色授权持久化、运行时权限上下文、卸载清理治理、源码插件 AdminService 不使用字符串声明和动态插件领域方法授权与菜单权限分离。
- `plugin-host-domain-capabilities`：插件宿主数据领域能力总边界、`CapabilityContext`、领域命名 ID、批量缺失语义、`labelKey`/`label`语义、缓存一致性和治理扫描。
- `plugin-service-layout`：插件服务根包 facade 职责清晰、测试按被测职责组织。
- `distributed-cache-coordination`：缓存敏感依赖不得使用孤立默认服务图、复杂度治理审查记录实例来源和扫描成本、插件管理读模型缓存复用`plugin-runtime`协调。

### Modified Capabilities

- `menu-management`、`role-management`、`user-auth`、`cron-jobs`、`cluster-deployment-mode`、`cluster-topology-boundaries`、`distributed-locker`、`leader-election`、`project-setup`、`release-image-build`、`e2e-suite-organization`、`server-monitor`、`online-user`、`core-host-boundary-governance`、`module-decoupling`、`service-dependency-injection-governance`、`source-upgrade-governance`和`system-api-docs`只保留插件相关交叉影响摘要，不再由本分组长期保存完整规范全文。

## Impact

- 后端影响集中在插件注册、运行时加载、生命周期编排、`WASM`桥接、host service、能力目录、领域能力适配、启动引导、升级治理、缓存一致性、插件管理读模型、协议样板治理和内部文件组织。
- 前端影响集中在插件管理摘要列表、详情按需加载、动态页面承载、插件菜单和路由刷新、公开资产引用、安装与升级弹窗，以及插件状态变化后的用户体验保护。
- 数据和配置影响集中在插件治理表、发布快照、迁移账本、资源引用、`plugin.autoEnable`、插件运行期配置、manifest 资源和动态产物快照。动态`data`服务收窄为当前插件自有表访问。
- 构建与工具影响集中在`build-wasm`、host-only/plugin-full 构建测试、插件工作区管理命令、发布链路、治理扫描和 host service 协议覆盖测试。
- 本归档压缩不修改运行时代码、数据库、`API`、前端页面或插件源码；当前能力契约以`openspec/specs`为准，归档仅保留历史设计和治理原因。
