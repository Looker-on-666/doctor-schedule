# 陈明教授出诊安排

在线查看：https://doctor-schedule-2kg.pages.dev

## 每月更新流程

### 方法一：使用更新脚本（推荐）

```bash
node update-schedule.js
```

按提示输入新排班，脚本会自动更新 `schedule.json`。

然后提交推送：
```bash
git add schedule.json
git commit -m "更新11月排班"
git push origin main
```

### 方法二：直接编辑 schedule.json

打开 `schedule.json`，修改：
- `month`: 新月
- `regular`: 新排班
- `exceptions`: 特殊日期（可选）

然后提交推送。

### 月底添加下月数据

在 `schedule.json` 中填 `next` 字段：
```json
"next": {
  "month": "2026-12",
  "regular": { ... },
  "exceptions": {}
}
```

推送后页面会出现月份切换按钮。

## 文件说明

- `schedule.json` - 排班数据（月份、 regular、exceptions、next）
- `info.json` - 静态信息（医生姓名、提示、出诊地点详情）
- `index.html` - 页面
- `qrcodes/` - 各门诊部微信公众号二维码
- `update-schedule.js` - 更新脚本
