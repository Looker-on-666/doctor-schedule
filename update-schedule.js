const fs = require('fs');
const path = require('path');

const schedulePath = path.join(__dirname, 'schedule.json');

// 读取当前数据
let data;
try {
  data = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
} catch (e) {
  console.error('读取 schedule.json 失败:', e.message);
  process.exit(1);
}

console.log('当前月份:', data.month);
console.log('当前排班:', JSON.stringify(data.regular, null, 2));

// 提示输入新月排班
console.log('\n请输入新月份排班（格式：二下午=东城，三上午=博爱堂，...）');
console.log('直接回车跳过，输入 "q" 退出\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const newRegular = {};

function askNext() {
  rl.question('排班（如"二下午=东城"）：', (answer) => {
    if (!answer || answer.toLowerCase() === 'q') {
      finish();
      return;
    }

    const match = answer.match(/^(.+?)=(.+)$/);
    if (match) {
      newRegular[match[1].trim()] = match[2].trim();
      console.log('已添加:', match[1].trim(), '->', match[2].trim());
    } else {
      console.log('格式错误，请用"时间段=地点"格式');
    }
    askNext();
  });
}

function finish() {
  rl.close();

  if (Object.keys(newRegular).length > 0) {
    data.regular = newRegular;
  }

  // 询问月份
  rl.question('\n新月份（如 2026-11）：', (month) => {
    if (month) {
      data.month = month.trim();
    }

    // 询问特殊日期
    rl.question('特殊日期（如 2026-11-05=停诊，多个用逗号分隔）：', (exceptions) => {
      if (exceptions) {
        data.exceptions = {};
        exceptions.split(',').forEach(item => {
          const match = item.trim().match(/^(.+?)=(.+)$/);
          if (match) {
            data.exceptions[match[1].trim()] = match[2].trim();
          }
        });
      }

      // 保存
      fs.writeFileSync(schedulePath, JSON.stringify(data, null, 2) + '\n');
      console.log('\n已更新 schedule.json');
      console.log('请运行以下命令提交：');
      console.log('  git add schedule.json');
      console.log('  git commit -m "更新' + data.month + '排班"');
      console.log('  git push origin main');

      process.exit(0);
    });
  });
}

askNext();
