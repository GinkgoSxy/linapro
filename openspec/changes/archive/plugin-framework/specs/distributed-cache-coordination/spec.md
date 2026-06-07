# distributed-cache-coordination Specification

## Purpose

定义插件运行时缓存敏感依赖的来源约束、复杂度治理审查要求和插件管理读模型缓存协调策略。

## Requirements

### Requirement: 插件缓存敏感依赖不得使用孤立默认服务图

系统 SHALL 确保插件管理、动态插件 runtime、WASM host service、source plugin registrar 和插件能力适配器中的缓存敏感依赖都来自拓扑感知启动构造边界或测试 fixture 显式注入。生产路径 MUST NOT 通过包级变量、构造函数 fallback、setter 默认值或普通业务调用临时创建仅当前节点可见的 cache、config、session、lock、notify、plugin runtime 或 capability service 实例。

#### Scenario: WASM cache host service 不创建本地默认 cache

- **WHEN** 集群模式下动态插件通过 `cache` host service 读写插件缓存
- **THEN** dispatcher 使用启动期注入的共享 `kvcache.Service` 或共享后端
- **AND** 不存在包级默认 `kvcache.New()` 实例参与生产调用

#### Scenario: runtime session store 来自启动期共享实例

- **WHEN** 动态插件路由鉴权需要校验在线 session hot state
- **THEN** runtime 使用启动期注入的 session store 或同一 coordination-backed 事实源
- **AND** 不因 runtime 内部默认 `session.NewDBStore()` fallback 绕过已配置的集群 session 热状态

#### Scenario: 缺失共享依赖时 fail fast

- **WHEN** 插件 runtime 或 WASM host service 缺失缓存敏感共享依赖
- **THEN** 构造、启动配置或首次 host call 返回明确错误
- **AND** 系统不得静默退化为仅当前节点可见的默认实例

### Requirement: 插件复杂度治理审查必须记录实例来源和扫描成本

系统 SHALL 在插件 runtime、host service、pluginbridge 或插件能力适配器变更审查中记录运行期依赖实例来源、共享边界、缓存一致性影响和高频路径扫描成本。

### Requirement: 插件管理读模型缓存必须复用 plugin-runtime 协调

系统 SHALL 将插件管理摘要列表读模型和详情读模型视为 `plugin-runtime`派生缓存。缓存 MUST 绑定插件运行时修订号、locale 和运行时翻译包版本，并复用既有单机本地 revision 或集群 Redis revision/event 完成失效；系统 MUST NOT 为插件管理读模型创建仅当前节点可见的独立缓存协调域。

#### Scenario: 单节点模式本地失效插件管理读模型

- **WHEN** `cluster.enabled=false` 且插件安装、启用、禁用、卸载、升级、active release 切换或源码插件同步成功
- **THEN** 系统更新本地 `plugin-runtime` revision
- **AND** 当前进程内插件管理摘要列表缓存和对应插件详情缓存失效

#### Scenario: 集群模式通过 Redis event 失效插件管理读模型

- **WHEN** `cluster.enabled=true` 且某节点发布 `plugin-runtime` Redis revision/event
- **THEN** 其他节点观察到 revision 前进后失效本地插件管理摘要列表缓存和受影响插件详情缓存

#### Scenario: 无法确认 freshness 时不返回过期治理状态

- **WHEN** 节点无法确认 `plugin-runtime` revision freshness
- **AND** 本地插件管理读模型超过域策略允许的陈旧窗口
- **THEN** 系统不得返回过期摘要列表或详情
- **AND** 系统按插件运行时故障策略 conservative-hide 或结构化错误处理该请求
