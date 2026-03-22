# 图表设计规范

## 1. 图表类型总览

### 1.1 支持的图表类型
| 图表类型 | Mermaid语法 | 用途 | 适用场景 |
|----------|-------------|------|----------|
| 目录结构图 | `graph TD` | 展示目录层次结构 | 阶段1：项目概览 |
| 功能树图 | `graph TD` | 展示功能层次结构 | 阶段2：功能树 |
| 模块依赖图 | `graph LR` | 展示模块依赖关系 | 阶段2：模块关系 |
| 数据流图 | `graph LR` | 展示数据流动过程 | 阶段3：数据流 |
| 调用链图 | `sequenceDiagram` | 展示函数调用序列 | 阶段3：接口契约 |
| 接口图 | `classDiagram` | 展示接口结构 | 阶段3：接口契约 |
| 状态图 | `stateDiagram` | 展示状态转换 | 可选 |
| 实体关系图 | `erDiagram` | 展示数据模型 | 可选 |
| 完整架构图 | `graph TD` | 展示完整系统架构 | 阶段4：最终报告 |

## 2. 各阶段图表设计

### 2.1 阶段1：项目概览
#### 目录结构图
```mermaid
graph TD
  root[项目根目录] --> src[src/]
  root --> test[test/]
  root --> docs[docs/]
  root --> config[配置文件]
  
  src --> modules[模块目录]
  src --> utils[工具目录]
  src --> types[类型定义]
  
  modules --> mod1[module1/]
  modules --> mod2[module2/]
  
  mod1 --> file1[file1.ts]
  mod1 --> file2[file2.ts]
```

#### 技术栈图
```mermaid
graph TD
  subgraph 语言
    ts[TypeScript]
    js[JavaScript]
  end
  
  subgraph 框架
    react[React]
    express[Express]
  end
  
  subgraph 工具
    webpack[Webpack]
    jest[Jest]
  end
  
  ts --> react
  ts --> express
  js --> react
  js --> express
```

### 2.2 阶段2：功能树
#### 功能层次图
```mermaid
graph TD
  root[系统功能] --> core[核心功能]
  root --> aux[辅助功能]
  root --> base[基础功能]
  
  core --> f1[用户管理]
  core --> f2[数据处理]
  core --> f3[报表生成]
  
  f1 --> f11[用户注册]
  f1 --> f12[用户登录]
  f1 --> f13[用户信息管理]
  
  f2 --> f21[数据导入]
  f2 --> f22[数据导出]
  f2 --> f23[数据分析]
  
  f3 --> f31[报表设计]
  f3 --> f32[报表生成]
  f3 --> f33[报表导出]
```

#### 功能依赖图
```mermaid
graph LR
  f11[用户注册] --> f12[用户登录]
  f12 --> f13[用户信息管理]
  
  f21[数据导入] --> f22[数据导出]
  f22 --> f23[数据分析]
  
  f31[报表设计] --> f32[报表生成]
  f32 --> f33[报表导出]
  
  f11 --> f21
  f12 --> f21
  f13 --> f21
```

### 2.3 阶段2：模块关系
#### 模块依赖图
```mermaid
graph LR
  um[用户管理模块] --> db[数据库访问模块]
  dp[数据处理模块] --> db
  dp --> fo[文件操作模块]
  rg[报表生成模块] --> db
  rg --> fo
  
  um --> log[日志记录模块]
  dp --> log
  rg --> log
```

#### 功能到模块映射图
```mermaid
graph LR
  subgraph 功能
    f1[用户管理]
    f2[数据处理]
    f3[报表生成]
  end
  
  subgraph 模块
    m1[UserModule]
    m2[DataModule]
    m3[ReportModule]
  end
  
  f1 --> m1
  f2 --> m2
  f3 --> m3
```

### 2.4 阶段3：数据流
#### 数据流图
```mermaid
graph LR
  user[用户] --> um[用户管理模块]
  um --> db[数据库]
  
  user --> dp[数据处理模块]
  dp --> db
  dp --> fs[文件系统]
  
  user --> rg[报表生成模块]
  rg --> db
  rg --> fs
  
  um --> log[日志系统]
  dp --> log
  rg --> log
```

#### 数据转换图
```mermaid
graph LR
  input[原始数据] --> validate[数据验证]
  validate --> transform[数据转换]
  transform --> output[处理后数据]
  
  subgraph 转换过程
    validate --> |验证通过| transform
    validate --> |验证失败| error[错误处理]
  end
```

### 2.5 阶段3：接口契约
#### 调用链图
```mermaid
sequenceDiagram
  participant U as 用户
  participant API as API网关
  participant US as 用户服务
  participant DB as 数据库
  
  U->>API: POST /api/login
  API->>US: 验证用户
  US->>DB: 查询用户
  DB-->>US: 用户数据
  US-->>API: 验证结果
  API-->>U: 登录响应
```

#### 接口图
```mermaid
classDiagram
  class UserService {
    +register(user: User): Promise<User>
    +login(credentials: Credentials): Promise<Token>
    +getUser(id: string): Promise<User>
    +updateUser(id: string, user: User): Promise<User>
  }
  
  class UserRepository {
    +create(user: User): Promise<User>
    +findByEmail(email: string): Promise<User>
    +findById(id: string): Promise<User>
    +update(id: string, user: User): Promise<User>
  }
  
  UserService --> UserRepository
```

### 2.6 阶段4：最终报告
#### 完整架构图
```mermaid
graph TD
  subgraph 系统
    subgraph 模块1[用户管理模块]
      功能1[用户注册]
      功能2[用户登录]
      功能3[用户信息管理]
    end
    
    subgraph 模块2[数据处理模块]
      功能4[数据导入]
      功能5[数据导出]
      功能6[数据分析]
    end
    
    subgraph 模块3[报表生成模块]
      功能7[报表设计]
      功能8[报表生成]
      功能9[报表导出]
    end
    
    subgraph 基础模块
      功能10[数据库访问]
      功能11[文件操作]
      功能12[日志记录]
    end
  end
  
  功能1 --> 功能10
  功能2 --> 功能10
  功能3 --> 功能10
  功能4 --> 功能10
  功能4 --> 功能11
  功能5 --> 功能10
  功能5 --> 功能11
  功能6 --> 功能10
  功能7 --> 功能10
  功能8 --> 功能10
  功能8 --> 功能11
  功能9 --> 功能11
  
  功能1 --> 功能12
  功能2 --> 功能12
  功能3 --> 功能12
  功能4 --> 功能12
  功能5 --> 功能12
  功能6 --> 功能12
```

## 3. 图表规范

### 3.1 命名规范
1. **节点命名**：使用中文，简洁明了
2. **边命名**：使用中文，描述关系
3. **子图命名**：使用中文，描述模块或功能组

### 3.2 样式规范
1. **颜色**：使用默认Mermaid颜色
2. **形状**：使用标准形状
3. **布局**：根据图表类型选择合适的布局

### 3.3 大小限制
1. **最大节点数**：50
2. **最大边数**：100
3. **最大嵌套深度**：5层

### 3.4 格式要求
1. **标题**：每个图表必须有描述性标题
2. **说明**：复杂图表需要添加说明
3. **引用**：图表中的节点应该与文档中的内容对应

## 4. 图表生成规则

### 4.1 自动生成规则
1. **目录结构图**：从目录结构自动生成
2. **功能树图**：从功能分析自动生成
3. **模块依赖图**：从模块分析自动生成
4. **数据流图**：从数据流分析自动生成

### 4.2 手动生成规则
1. **调用链图**：从代码分析手动生成
2. **接口图**：从接口定义手动生成
3. **完整架构图**：从所有分析结果手动生成

### 4.3 验证规则
1. **语法验证**：验证Mermaid语法是否正确
2. **逻辑验证**：验证图表逻辑是否正确
3. **一致性验证**：验证图表与文档是否一致

## 5. AI开发时的使用方式

### 5.1 理解系统
1. **查看目录结构图**：快速了解项目组织
2. **查看完整架构图**：了解系统整体架构
3. **查看模块依赖图**：了解模块间依赖关系

### 5.2 开发功能
1. **查看功能树图**：确定功能位置
2. **查看功能到模块映射图**：确定实现模块
3. **查看数据流图**：了解数据处理方式

### 5.3 调试问题
1. **查看调用链图**：追踪函数调用过程
2. **查看数据流图**：追踪数据处理过程
3. **查看模块依赖图**：确定影响范围
