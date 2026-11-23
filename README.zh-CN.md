# Onus

[English](README.md) | 简体中文

**举证责任在 agent 一方。** 一套面向编码 agent 的开发方法：一个写手，一个
能证明自己发现的独立审查者，以及会变成检查项的教训。

它就是纯 Markdown：六个 Agent Skill、四份文档模板和两个检查脚本。没有运行时，
也没有需要安装的控制器。Claude Code、Pi 和 Codex 读的是同一批文件。

这套方法提炼自一个真实项目
[Breaker Delta](https://github.com/daiyanze/breaker-delta)，在几天的真实
Pull Request 中逐渐成形。哪些部分验证过、哪些没有，写在
[VALIDATION.md](VALIDATION.md) 里。在依赖其中任何一部分之前，请先读它。

## 🎯 它解决的问题

编码 agent 能很快写出一个看起来合理的改动。麻烦在那之后才开始：

- **"完成"只是一句声明，不是证据。** 测试通过了，但没人把应用跑起来。PR 里写着
  "行为不变"，却没有任何东西能证明。
- **作者审查自己的工作。** 写下改动的那个会话，会相信它自己对改动的描述。
- **同样的错误反复出现。** 一次纠正只活在一段对话里，下一段就没了。写进文档的规则
  被读过、被认同，然后被违反。
- **每个工具看到的规则都不一样。** 为某个 agent 运行时写的指令，其他运行时看不见。

## ⚖️ 唯一的规则

*Onus probandi*（举证责任）：谁主张，谁举证。

| 谁主张 | 主张什么 | 什么算证据 |
| --- | --- | --- |
| 写手 | "完成了"、"行为不变"、"测试覆盖了" | 命令及其输出；在真实界面上实际操作应用 |
| 审查者 | "这是个 bug" | 一次能让它失败的运行。读代码能发现 bug，但证明不了 bug |
| 审查者 | "这违反了某条规则" | 引用规则原文，以及违反它的那几行代码 |
| 文档 | "这个检查保证了 X" | 点名具体哪项检查会在 X 被破坏时失败，并且只算它代码真正覆盖的范围。成本低的话，在临时副本里破坏 X，亲眼看到检查失败 |
| 仓库所有者 | "合并" | 所有者自己的决定。agent 永远不合并 |

方法里的其余一切，都由这张表推导而来。

## 🧭 一页纸讲清方法

1. **只有一份规则文件。** `AGENTS.md` 写明项目是什么、常用命令、不变量，以及一张
   "每条规则由什么来保证"的表。`CLAUDE.md` 只负责导入它，这样每个运行时读到的是
   同一份文本。
2. **每个改动走同一个循环：** 探索、计划、编码、验证、PR、审查、总结教训。贯穿其中
   的四条原则：先想后写、简单优先、外科手术式改动、目标驱动执行。
3. **在真东西上验证。** 检查命令覆盖类型、lint 和测试。凡是用户能看到的改动，还要用
   项目自己的 verify skill 在运行中的应用上实际操作一遍，并保留证据。
4. **每个 PR 都有独立审查。** 一个全新的、不带写手任何上下文的 agent，先读 diff
   再读描述，亲自运行改动，分三轮找问题，只报告它能证明的东西。它逐条回答验收标准，
   并只发一条评论。它的结论只对应一个 commit。之后的 commit 需要重新审查，除非
   它们只是在修复这次审查提出的意见。
5. **教训变成检查。** 被所有者、CI 或审查抓到的错误，连同适用范围一起记下来。如果能
   用检查来保证，就加上检查，并且放在能起作用的最高层级：架构，其次类型，再次 lint
   或 CI，然后测试，书面规则排在最后。重复出现的错误，其规则上移一级。
6. **目标先规划再动手。** 超过一个 issue 的工作要先设计：用代码勾出至少两种
   结构不同的方案，由一个必须证明自己发现的独立 agent 挑战选中的方案，记录成决定，
   再拆成每个对应一个 Pull Request 的 issue，依赖关系由脚本检查。
7. **长时间运行要有退出条件。** 拿到的是目标而不是 issue，agent 就先写出一个
   能用命令检查的条件，然后一个 issue 接一个 issue 地做，维护一份决策日志，把需要
   所有者决定的事情搁置下来，并且绝不为了收工而放宽条件。
8. **由所有者合并。** agent 永远不合并，永远不推送到基础分支，在做任何无法撤销的事
   之前都会停下来询问。

## 🚀 快速开始

你需要：一个 GitHub 上的仓库、`gh` CLI，以及任意一个受支持的 agent。

**1. 把 skill 放进你的仓库。** 把 [`skills/`](skills) 下的六个文件夹复制到你项目的
`.claude/skills/` 中。[skills CLI](https://github.com/vercel-labs/skills)
可以一次为多个 agent 完成这一步：

```bash
npx skills add daiyanze/Onus
```

**2. 让你的 agent 为仓库立章程。**

```text
/charter
```

它会写出 `AGENTS.md`、`CLAUDE.md`、`docs/development.md` 和 `docs/lessons.md`，
链接 skill 文件夹让每个运行时都能找到它们，加上检查脚本，然后开一个 Pull Request。
它不改任何产品代码。在 Node 项目里，它会为检查脚本加一个开发依赖（`yaml`）。

**3. 完成所有者那一份。** Pull Request 里会列出来：创建 agent 标签，保护你的基础分支
（通常是默认分支），决定哪些是受保护路径，划掉任何你不想要的"建议不变量"。然后合并。

**4. 开始干活。**

```text
/take-case                        agent 可以做的下一个 issue，端到端完成
/take-case #42                    指定这个 issue
/docket finish milestone 2        一个接一个 issue，直到退出条件成立
/cross-examine 57                 对 Pull Request 57 做独立审查
/brief per-source rate limits     先设计，再拆成 issue
```

每个 issue 的终点都是一个 CI 全绿、带独立审查评论的 Pull Request。你读评论，然后合并。

## 📚 Skill 一览

名字取自法庭，因为这套方法关心的就是谁必须证明什么。每个 skill 的描述里也带着
它的通俗叫法（下一个 issue、PR 审查），这样你用自己的话提问时，agent 也能挑对
skill。`docket` 是例外，只有你点名它才会启动，因为长时间运行绝不应该自己开始。
它 frontmatter 里的 `disable-model-invocation` 告诉 Claude Code 和 Pi 不要自行
启动它，`agents/openai.yaml` 则告诉 Codex。

| Skill | 通俗叫法 | 什么时候用 |
| --- | --- | --- |
| [`charter`](skills/charter/SKILL.md) | 采用这套方法 | 每个仓库一次 |
| [`take-case`](skills/take-case/SKILL.md) | 下一个 issue | 你想完成下一个 issue，或某个指定的 issue |
| [`docket`](skills/docket/SKILL.md) | 长时间运行 | 你手上是一个目标，而不是一个 issue |
| [`cross-examine`](skills/cross-examine/SKILL.md) | PR 审查 | PR 已打开且 CI 全绿 |
| [`evidence-kit`](skills/evidence-kit/SKILL.md) | 生成 verify skill | 每个有用户可见界面的项目一次 |
| [`brief`](skills/brief/SKILL.md) | 设计并拆成 issue | 一个目标需要不止一个 Pull Request |

如何调用：

| 运行时 | 从哪里读规则 | 在哪里找 skill | 调用方式 |
| --- | --- | --- | --- |
| Claude Code | `CLAUDE.md`（导入 `AGENTS.md`） | `.claude/skills` | `/take-case` |
| Pi | `AGENTS.md` | `.agents/skills` | `/skill:take-case` |
| Codex | `AGENTS.md` | `.agents/skills` | `$take-case`，或在 `/skills` 中选择 |

Pi 只有在你信任该项目之后，才会加载项目里的 `.agents/skills`。

### `charter`：采用这套方法

- **读取：** 你的 README、package scripts、CI workflow、已有的 `AGENTS.md` 或
  `CLAUDE.md`、`CODEOWNERS`，以及你自己的 open issue 是怎么写 "Depends on"、
  怎么命名 milestone 的。
- **询问你：** 只问仓库本身回答不了的问题，通常是 agent 标签和哪些路径需要你批准。
- **写入：** 四份文档、skill 文件夹链接、检查脚本。已有的规则会迁入 `AGENTS.md`，
  一条都不丢。已有的 `docs/development.md` 不会被覆盖：它会停下来问你。
- **结束于：** 一个由 `cross-examine` 审查过的 Pull Request，列出只有你能做的事。
  它推断出来的不变量会标注为"（建议）"。

### `take-case`：下一个 issue

- **挑选：** 带 agent 标签、其 "Depends on" 的 issue 都已关闭、且还没有 open PR
  覆盖的 open issue。如果项目按 milestone 推进，只在仍有候选的最早 milestone 里挑，
  或按你在 `docs/development.md` 里给出的顺序。它也会识别你在那里列出的依赖写法。
  在这些候选中，优先选能解锁最多其他 issue 的，其次选编号最小的。它只读带标签的
  issue 的正文。
- **执行：** `docs/development.md` 里的循环：建分支、实现、检查、如果用户能看到改动
  就在真实应用上验证、推送、开 PR、等 CI、启动一个独立的 `cross-examine`。
- **停下来询问：** 与已记录的决定冲突、需要某个密钥、碰到 issue 没提到的受保护路径，
  或任何无法撤销的操作。
- **汇报：** PR 链接、哪些没能在本地验证、审查结论、哪些需要你处理。

### `docket`：朝一个目标长时间运行

```text
/docket every open agent-ok issue in milestone 2
```

- **开始时** 把退出条件写成一个能用命令检查的东西，并用一行告诉你。例如：milestone 2
  中所有带 agent 标签、依赖都已关闭的 open issue，都有一个 CI 全绿、且有覆盖其最新
  commit 的批准审查的 open PR。
- **循环** 执行 `take-case`，直到条件成立或没有候选为止。每个决定在
  `.runs/<date>-<goal>.tsv` 里记一行。
- **搁置** 某个 issue 交给你并继续往下走的情况：三轮审查都没获批准、同一项检查修了
  三次仍失败，或者需要一个只有你能做的决定。
- **接续** 之前会话停下的地方，依据日志、open PR 和 `git log`，不重复做已完成的工作。
- **绝不** 合并、推送到基础分支或部署。

### `cross-examine`：独立 PR 审查

在新会话或新 agent 中运行，绝不在写这个 PR 的会话里运行。

- **先读** diff 再读描述，把描述里的每一句声明都当作待验证的假设。
- **运行** 检查命令（在它自己的 worktree 中），并编写一次性的探针来确认它的怀疑。
- **分三轮查找**（规则、bug、测试证据），然后丢掉所有它证明不了的候选问题。
- **发布** 一条评论，并回读确认：

```text
_Review by an independent agent (<model>), at <full head SHA>._

**Verdict:** approve | approve with nits | request changes
**Checks:** the check command's result, and where it ran.

**Acceptance criteria**
- <criterion>: met | not met | cannot tell - the evidence.

**Blocking issues**
1. <file:line permalink> what is wrong, why it matters, how it was confirmed.

**Non-blocking notes**
**Claims checked** / **Not checked** / **How this review ran**
**Second model** / **Protected paths touched**
```

### `brief`：设计一个目标并拆成 issue

```text
/brief per-source rate limits
```

- **界定** 目标：把"完成"写成一项检查，并写明哪些不在范围内。一个 Pull Request
  就能做完的工作，会被退回正常的循环。
- **打底：** 读不变量、已记录的决定、教训和代码。会改变方案结构的未知点，用探针去
  验证，而不是靠争论。
- **勾出** 至少两种结构不同的方案：先写清结果会被怎么使用，再把方案写成代码放在
  临时分支上，让类型检查读到。比较的维度是：每份状态是否只有一个所有者、调用方需要
  知道多少、各自怎么失败、怎么验证、是否守住不变量，以及哪些是单向门。
- **挑战：** 由一个不带任何上下文的独立 agent 来挑战，它只报告自己能证明的东西。最多
  三轮，之后由你决定。
- **记录** 决定：选中方案的类型作为契约，并写明哪些迹象说明这个方案错了。
- **拆分** 成 `docs/plans/<slug>.yaml`：每个 issue 只有一个关注点，风险最大的先做，
  契约尽早落地，验收标准都是检查。`scripts/check-plan.mjs` 检查计划的格式，并打印
  创建 issue 的顺序；它检查什么、不检查什么，写在脚本顶部的注释里。
- **结束于** 一个交给你的 Pull Request。你合并之后，并且只在你要求时，它才创建
  issue，而且不加 agent 标签：哪些可以交给 agent，由你来打标签。

### `evidence-kit`：生成项目的 verify skill

为你的应用生成 `.claude/skills/verify-<app>/`：一个小型测试装置，它会启动一个隔离的
实例，确认它值得操作，实际走一遍真实的路由或命令，把每次响应都存为证据，并且只清理
它自己启动的东西。它还会加上一份功能地图，以及一个在 CI 中端到端跑一遍该 skill
所有步骤的环节。

## 🧾 案例

这些都真实发生过，每条都附有记录链接。

**一项检查声称覆盖了它没覆盖的东西。** Breaker Delta 的保证表写着：受保护路径由
CODEOWNERS 和分支保护来保证，并且有一项依赖检查让 Web 应用无法引用 pipeline 的
代码。审查通过 GitHub API 读取了仓库规则：实际上并不要求任何批准。接着它从 Web 应用
向 pipeline 写了一个相对路径导入，依赖检查照样放行。两行内容都被重写成真实情况：
第一行现在说明所有者的合并才是真正的保证，第二行列出了缺口，并指向一条新的审查清单项。
（[审查](https://github.com/daiyanze/breaker-delta/pull/197#issuecomment-7079384816)）

**一个清理命令可能杀错进程。** verify 装置记录了它所启动应用的进程 ID。审查写了一个
过期的状态文件，里面存着一个无关 `sleep` 进程的 ID，运行清理命令，眼看着它把那个
进程杀掉了。现在装置只会向仍在响应的那个应用进程发信号。
（[审查](https://github.com/daiyanze/breaker-delta/pull/196#issuecomment-7079357309)）

**一个教训重复出现，于是变成了检查。** 一个 skill 文件检查用正则表达式读取 YAML。
审查喂给它一些 YAML 解析器会拒绝、Pi 也会丢弃的行，而正则却放行了。这已经是第二次
用手写规则去解析某种格式，所以现在这项检查改用真正的解析器，教训里也点名了这一点。
（[审查](https://github.com/daiyanze/breaker-delta/pull/199#issuecomment-7080396875)，
[教训 L14](https://github.com/daiyanze/breaker-delta/blob/develop/docs/lessons.md)）

**三轮之后，由所有者拍板。** 重写本仓库的那个 Pull Request
（[#18](https://github.com/daiyanze/Onus/pull/18)）被审查了三次。每一轮都要求修改，
问题也一轮比一轮窄。第一轮是一个通过链接调用时什么都不做的脚本，第二轮是文档声称能捕获、实际却
捕获不了的两种情形，第三轮只剩一句话。反复出现的根源是同一条声明在四个地方各说了一遍。
最后的修复动了结构，脚本顶部只保留一处"这项检查覆盖什么"的说明，每一行都配一个测试。
三轮之后，方法把决定交给所有者，所有者选择了合并。
（[第 1 轮](https://github.com/daiyanze/Onus/pull/18#issuecomment-7081977672)，
[第 2 轮](https://github.com/daiyanze/Onus/pull/18#issuecomment-7082233779)，
[第 3 轮](https://github.com/daiyanze/Onus/pull/18#issuecomment-7082514830)）

**四条审查从未真正发出。** 在 Breaker Delta 中，有四条审查评论里只有一个文件名，
而不是审查内容：`gh api -f body=@file` 会把 `@file` 当作文本发送，并不会读取文件。
那几个 Pull Request 在 PR 上没有可读审查的情况下被合并了。现在 `cross-examine`
明确写出了正确的发评论命令（`-F body=@file`），并会回读评论确认。
（[#177](https://github.com/daiyanze/breaker-delta/pull/177#issuecomment-7061908475)，
[#178](https://github.com/daiyanze/breaker-delta/pull/178#issuecomment-7062356065)，
[#179](https://github.com/daiyanze/breaker-delta/pull/179#issuecomment-7062784471)，
[#181](https://github.com/daiyanze/breaker-delta/pull/181#issuecomment-7063079058)）

## 🛡️ 它不做什么

- 它不合并、不部署、不删除。这些留给所有者。
- 它不靠代码强制执行自己。skill 只是指令。把它们固定住的，是你的检查命令、你的分支
  规则，以及只有你能合并这一事实。请在 `AGENTS.md` 里如实写明你的分支规则到底要求
  了什么。
- 它不替代你的测试或 CI，而是使用它们。
- 它还没有在多种模型或多个团队中得到证明。目前只有一个项目、一个模型家族。

## 📏 基准测试

[`bench/`](bench/README.md) 在 Claude Code、Codex 和 Pi 上，分别以不使用方法、
使用当前版本、使用某个早期版本三种方式运行同一批小任务，记录每次试验的结果和 token
用量。共三个检查点，每个检验一条主张：一个只在运行中的服务器上才会暴露的 bug、一个
埋了两个 bug 的 PR，以及去掉这两个 bug 的同一个 PR。评分器检查的是实际发生了什么，
而不是 agent 自己汇报了什么。结果见 [`bench/RESULTS.md`](bench/RESULTS.md)。

```sh
node bench/run.mjs --runtime claude --arms none,onus,onus@<previous tag> --trials 3
node bench/report.mjs
```

## 🗺️ 下一步

- 在全部三个运行时上跑出当前版本的基准结果，然后打 tag。
- `clerk`（盯着一个 PR 走完 CI 和审查）、`recess`（安全暂停）、`precedent`
  （从历史中找出反复出现的错误并把它们变成检查）、`debrief`（运行结束后提出 skill
  修改建议）。

## 参考来源

- [Andrej Karpathy 关于编码的观察](https://x.com/karpathy/status/2015883857489522876)
  以及[社区 Skill](https://github.com/multica-ai/andrej-karpathy-skills)：四条原则。
- Anthropic 的 Claude Code 最佳实践及其 `code-review` 插件：探索、计划、编码、提交；
  证据优先于声明；独立的发现者，再对每个发现逐一验证。
- poteto 的 [pstack](https://github.com/cursor/plugins/tree/main/pstack)：在真实
  界面上验证、按工作类型准备操作手册、长时间运行的退出条件、为每个错误配一条规则
  并写明由什么来保证。`brief` 借鉴了 pstack 的 `architect`、`interrogate` 和
  `figure-it-out` 的思路：先写用法再定类型、至少两种结构不同的方案、必须证明自己
  发现的挑战者、风险最大的先做，以及放弃一个总要绕路的方案。
- [Agent Skills 规范](https://agentskills.io/specification)：可移植的 skill 格式。
- 本仓库历史中的早期设计（当时名为 Surgical Dev）：按验收标准逐条给出结论、结论绑定
  到单个 commit、无人值守工作的预算。
