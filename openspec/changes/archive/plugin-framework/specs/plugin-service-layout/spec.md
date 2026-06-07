# plugin-service-layout Specification

## Purpose

定义`apps/lina-core/internal/service/plugin`根包的文件组织规范，确保 facade 职责清晰、测试按被测职责组织、helper 收敛到明确位置。

## Requirements

### Requirement: 插件服务根包必须保持 facade 职责清晰

系统 SHALL 将`apps/lina-core/internal/service/plugin`根包作为插件宿主服务的稳定 facade，根包主文件只保留公共契约、核心类型、构造、轻量校验和必要 wiring。复杂实现流程 SHOULD 放在同包职责明确的非主文件或既有`internal/<subcomponent>`中。

#### Scenario: 根包新增复杂实现

- **WHEN** 开发者为插件根服务新增生命周期、runtime upgrade、列表投影、host service 或缓存相关复杂流程
- **THEN** 实现文件名必须体现具体职责
- **AND** 不得把具体流程直接塞回`plugin.go`主文件

### Requirement: 插件服务测试必须按被测职责组织

系统 SHALL 让插件服务单元测试文件与被测源码或明确主题关联。共享 helper MUST 放在职责明确的测试支撑文件或`internal/testutil`，并由当前测试显式调用。

#### Scenario: 根包测试 helper 被多个测试文件复制

- **WHEN** 同一测试 helper 被多个根包测试文件重复实现
- **THEN** helper 应收敛到根包`*_test.go`支撑文件或`internal/testutil`
- **AND** 不得为了复用 helper 扩大生产代码导出面
