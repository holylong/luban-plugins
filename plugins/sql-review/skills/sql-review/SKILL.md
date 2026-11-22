---
name: sql-review
description: 审阅 SQL 与索引:识别慢查询、隐式类型转换、缺索引与全表扫描,给出可验证的改写
---

# SQL 与索引审阅

## 什么时候用

- 用户贴出慢查询、`EXPLAIN` 结果或表结构问“为什么慢”
- 写迁移脚本、加索引、改查询条件之前

## 审阅顺序

1. **先看执行计划**，再看 SQL 文本。没有 `EXPLAIN` 就先要一份，或者说明这是推测。
2. 找出扫描方式：`Seq Scan` / `type: ALL` / `Using filesort` 都意味着读的行数远超返回的行数。
3. 看条件列与索引列是否匹配：类型、排序规则、是否对列做了函数运算。

## 常见问题清单

| 症状 | 原因 | 改法 |
| --- | --- | --- |
| `WHERE phone = 13800138000` 但 `phone` 是 varchar | 隐式类型转换,索引失效 | 参数写成字符串,或统一列类型 |
| `WHERE DATE(created_at) = '2026-01-01'` | 列被函数包裹 | 改成 `created_at >= '2026-01-01' AND created_at < '2026-01-02'` |
| `LIKE '%关键词%'` 全表扫 | 前导通配符 | 全文索引 / 倒排表 / 前缀匹配 `关键词%` |
| `ORDER BY created_at LIMIT 20` 慢 | 排序走 filesort | 建 `(status, created_at)` 复合索引,让过滤和排序同序 |
| `SELECT *` 后只用到两列 | 回表放大 | 只查需要的列,或让索引覆盖 |
| `IN (子查询)` 结果集过大 | 半连接代价高 | 改 `EXISTS`,或先聚合子查询 |

## 复合索引的列顺序

等值条件在前,范围条件在后,排序列跟着走。给 `(user_id, status, created_at)` 建索引时:

- `WHERE user_id = ? AND status = ? ORDER BY created_at` 可以完全用上
- `WHERE status = ?` 用不上(最左前缀缺失)
- `WHERE user_id = ? AND created_at > ?` 只能用到 `user_id`

## 输出格式

1. 结论一句话:慢在哪、代价大概多少行
2. 改写后的 SQL 或 `CREATE INDEX` 语句,可直接执行
3. 验证方法:`EXPLAIN (ANALYZE, BUFFERS)` 前后对比,说明预期从几次扫描降到几次
4. 风险:索引带来的写放大、锁时间、迁移是否需要 `CONCURRENTLY`

## 不要做

- 不要在没有执行计划时断言“加了索引就快了”
- 不要建议 `SELECT *` + 应用层排序
- 不要为了一个低频查询堆五个索引
