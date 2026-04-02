# GitNexus 命令速查

## 目录

- [初始化](#初始化)
- [Cypher 查询](#cypher-查询)
- [query 命令](#query-命令语义搜索)
- [context 命令](#context-命令符号视图)
- [impact 命令](#impact-命令变更影响)
- [多仓库场景](#多仓库场景)

---

## 初始化

仅在 Stage 1 执行一次。

```bash
cd <project-path>
npx gitnexus analyze .
```

## Cypher 查询

```bash
# 统计概览
npx gitnexus cypher "MATCH (n) RETURN count(n) AS total_nodes" --repo <repo>

# 公共 API 发现（所有导出函数）
npx gitnexus cypher "MATCH (n:Function) WHERE n.isExported = true RETURN n.name, n.filePath LIMIT 30" --repo <repo>

# 执行流程复杂度排序（stepCount 越高越核心）
npx gitnexus cypher "MATCH (p:Process) RETURN p.heuristicLabel, p.processType, p.stepCount ORDER BY p.stepCount DESC LIMIT 10" --repo <repo>

# 模块社区发现（自然聚类边界）
npx gitnexus cypher "MATCH (c:Community) RETURN c.heuristicLabel, c.symbolCount ORDER BY c.symbolCount DESC LIMIT 15" --repo <repo>

# 社区成员详情
npx gitnexus cypher "MATCH (f)-[:CodeRelation {type: 'MEMBER_OF'}]->(c:Community) RETURN c.heuristicLabel, collect(f.name) LIMIT 20" --repo <repo>

# 核心文件（被最多文件依赖）
npx gitnexus cypher "MATCH (f:File)<-[:CodeRelation {type: 'IMPORTS'}]-(g:File) RETURN f.name, count(g) AS deps ORDER BY deps DESC LIMIT 10" --repo <repo>

# 跨文件调用热图（模块间依赖强度）
npx gitnexus cypher "MATCH (a)-[:CodeRelation {type: 'CALLS'}]->(b) WHERE a.filePath <> b.filePath WITH a.filePath AS from, b.filePath AS to, count(*) AS n ORDER BY n DESC LIMIT 15 RETURN from, to, n" --repo <repo>

# 循环依赖检测
npx gitnexus cypher "MATCH path=(a:File)-[:CodeRelation*2..5]->(a) WHERE ALL(r IN relationships(path) WHERE r.type = 'IMPORTS') RETURN path LIMIT 10" --repo <repo>
```

## query 命令（语义搜索）

```bash
npx gitnexus query "project entry point and initialization" --repo <repo>
npx gitnexus query "authentication flow" --repo <repo>
npx gitnexus query "{ModuleName} core logic flow" --repo <repo>
npx gitnexus query "error handling" --repo <repo>

# 带上下文和目标
npx gitnexus query "API routing" --context "web app" --goal "find request handling" --repo <repo>

# 含源码（上下文充足时）
npx gitnexus query "core business logic" --content --limit 3 --repo <repo>
```

## context 命令（符号视图）

```bash
npx gitnexus context <SymbolName> --repo <repo>
npx gitnexus context <SymbolName> --file src/auth/service.ts --repo <repo>  # 消除同名歧义
npx gitnexus context <SymbolName> --content --repo <repo>                   # 含源码
npx gitnexus context --uid "Function:validateUser" --repo <repo>            # 精确 UID
```

## impact 命令（变更影响）

```bash
npx gitnexus impact <FunctionName> --direction upstream --repo <repo>    # 谁依赖它
npx gitnexus impact <FunctionName> --direction downstream --repo <repo>  # 它依赖谁
npx gitnexus impact <FunctionName> --depth 2 --include-tests --repo <repo>
```

## 多仓库场景

当 `status` 提示 `Multiple repositories indexed` 时，所有命令必须加 `--repo <repo-name>`。