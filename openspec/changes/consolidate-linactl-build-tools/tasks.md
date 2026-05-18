## 1. `image-builder`整合

- [x] 1.1 将`hack/tools/image-builder`实现迁移到`hack/tools/linactl/internal/imagebuilder`，并改造为可由`linactl`直接调用的内部包
- [x] 1.2 更新`linactl image`与`linactl image.build`命令，移除对子进程`go run ./hack/tools/image-builder`的依赖
- [x] 1.3 迁移或补齐镜像构建相关单元测试

## 2. `build-wasm`整合

- [x] 2.1 将`hack/tools/build-wasm/internal/builder`实现迁移到`hack/tools/linactl/internal/wasmbuilder`
- [x] 2.2 更新`linactl wasm`命令，直接调用`wasmbuilder`并保留插件工作区准备、`dry-run`和输出目录语义
- [x] 2.3 更新`linactl/go.mod`与根`go.work`，移除旧独立工具模块并维护`pluginbridge`相关依赖
- [x] 2.4 迁移或补齐动态插件`Wasm`打包相关单元测试

## 3. 引用与文档治理

- [x] 3.1 更新`CI`夹具、测试辅助、`E2E`用例和仓库工具文档中的旧路径引用
- [x] 3.2 删除`hack/tools/image-builder`与`hack/tools/build-wasm`旧独立工具目录
- [x] 3.3 更新中英文`README`文档，说明镜像构建和`Wasm`打包能力已由`linactl`统一承载

## Feedback

- [x] **FB-1**: 将`hack/tools/runtime-i18n`治理扫描组件合并到`linactl`内部组件，并保留`linactl i18n.check`公开入口
- [x] **FB-2**: 将`imagebuilder`、`plugins`和`wasmbuilder`内部组件源码文件统一为组件名前缀命名

## 4. 验证与审查

- [x] 4.1 运行`cd hack/tools/linactl && go test ./... -count=1`
- [x] 4.2 运行`cd hack/tools/linactl && go run . wasm dry-run=true`
- [x] 4.3 运行`cd hack/tools/linactl && go run . image --preflight --tag=test-preflight`或等价镜像构建烟测
- [x] 4.4 运行旧路径引用扫描、`openspec validate consolidate-linactl-build-tools --strict`和`git diff --check`
- [x] 4.5 记录`i18n`、缓存一致性、数据权限、开发工具脚本影响评估，并执行`lina-review`

## Implementation Notes

- 2026-05-18：完成`image-builder`与`build-wasm`到`linactl/internal`的整合。`linactl image`/`image.build`直接调用`internal/imagebuilder`，`linactl wasm`直接调用`internal/wasmbuilder`，并新增`plugin_dir=<path>`用于替代旧`build-wasm --plugin-dir`测试入口。删除旧`hack/tools/image-builder`与`hack/tools/build-wasm`独立模块，根`go.work`不再包含旧模块，`linactl/go.mod`显式声明`lina-core`本地依赖以支持`GOWORK=off`编译。同步更新`CI`夹具、后端测试辅助、`E2E`构建辅助和中英文工具文档。验证通过：`cd hack/tools/linactl && go test ./... -count=1`、`cd hack/tools/linactl && GOWORK=off go test ./... -count=1`、`cd hack/tools/linactl && go run . wasm dry-run=true`、`cd hack/tools/linactl && go run . image --preflight --tag=test-preflight`、`cd apps/lina-core && go test ./internal/service/plugin/internal/testutil -count=1`、`cd apps/lina-core && go test ./internal/service/plugin/internal/runtime -run 'TestBuildRuntimeWasmArtifactEmbedsBackendContracts|TestLoadRuntimePluginManifestFromArtifactHydratesBackendContracts' -count=1`、旧路径引用扫描、`openspec validate consolidate-linactl-build-tools --strict`和`git diff --check -- <本次变更范围>`。`i18n`影响：仅更新开发工具文档和命令输出/测试说明，不新增或修改前端运行时语言包、宿主/插件`manifest/i18n`或`apidoc`资源。缓存一致性影响：不涉及运行时缓存、失效、共享修订号或跨实例协调。数据权限影响：不新增或修改运行时数据接口。开发工具脚本影响：本次仅调整`Go`版`linactl`及`GitHub Actions`夹具，不新增平台专属脚本；已通过`linactl`测试和命令 smoke 验证。
- 2026-05-18：完成`FB-1`，将`hack/tools/runtime-i18n`迁移到`hack/tools/linactl/internal/runtimei18n`，`linactl i18n.check`直接调用内部包并保留扫描失败后继续执行消息覆盖检查的行为。默认扫描`allowlist`迁移到`hack/tools/linactl/internal/runtimei18n/allowlist.json`，删除旧`hack/tools/runtime-i18n`独立模块并从根`go.work`移除。同步更新`hack/tools`和`linactl`中英文`README`、OpenSpec 设计与增量规范。验证通过：`cd hack/tools/linactl && go test ./... -count=1`、`cd hack/tools/linactl && GOWORK=off go test ./... -count=1`、`cd hack/tools/linactl && go run . i18n.check`、旧`runtime-i18n`工具路径引用扫描、`openspec validate consolidate-linactl-build-tools --strict`和`git diff --check -- <本次变更范围>`。`i18n`影响：本次只迁移运行时`i18n`治理扫描工具和工具文档，不新增或修改前端运行时语言包、宿主/插件`manifest/i18n`或`apidoc`资源。缓存一致性影响：不涉及运行时缓存、失效、共享修订号或跨实例协调。数据权限影响：不新增或修改运行时数据接口。开发工具脚本影响：继续使用`Go`版`linactl`承载跨平台入口，不新增平台专属脚本。
- 2026-05-18：完成`FB-2`，将`hack/tools/linactl/internal/imagebuilder`、`hack/tools/linactl/internal/plugins`和`hack/tools/linactl/internal/wasmbuilder`下的`Go`源码文件统一为对应组件名前缀命名，仅调整文件路径，不变更包名、导出契约或业务逻辑。验证通过：目标目录文件名前缀扫描、`cd hack/tools/linactl && go test ./... -count=1`、`openspec validate consolidate-linactl-build-tools --strict`和`git diff --check -- <本次变更范围>`。`i18n`影响：不新增或修改用户可见文案、前端语言包、宿主/插件`manifest/i18n`或`apidoc`资源。缓存一致性影响：不涉及运行时缓存、失效、共享修订号或跨实例协调。数据权限影响：不新增或修改运行时数据接口。开发工具脚本影响：仅治理`linactl`内部`Go`源码文件命名，不新增或修改平台脚本。
