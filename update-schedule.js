const fs = require('fs');
const path = require('path');

const schedulePath = path.join(__dirname, 'schedule.json');

let data;
try {
  data = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
} catch (e) {
  console.error('读取 schedule.json 失败:', e.message);
  process.exit(1);
}

console.log('当前月份:', data.month);
console.log('当前排班:', JSON.stringify(data.regular, null, 2));
if (data.next) {
  console.log('\n下月排班 (' + data.next.month + '):', JSON.stringify(data.next.regular, null, 2));
}

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n请选择操作：');
console.log('  1 - 更新下月排班（存入 next 字段）');
console.log('  2 - 将下月排班提升为本月（月初时使用）');
console.log('  q - 退出\n');

rl.question('请选择 (1/2/q)：', (choice) => {
  choice = choice.trim();

  if (choice === 'q' || !choice) {
    rl.close();
    process.exit(0);
  }

  if (choice === '2') {
    if (!data.next) {
      console.log('\n没有下月排班数据，无法提升。');
      rl.close();
      process.exit(1);
    }
    data.month = data.next.month;
    data.regular = data.next.regular;
    data.exceptions = data.next.exceptions || {};
    data.next = null;
    rl.close();
    fs.writeFileSync(schedulePath, JSON.stringify(data, null, 2) + '\n');
    console.log('\n已将 ' + data.month + ' 提升为本月排班。');
    console.log('请运行以下命令提交：');
    console.log('  git add schedule.json');
    console.log('  git commit -m "切换到' + data.month + '排班"');
    console.log('  git push origin main');
    process.exit(0);
  }

  if (choice !== '1') {
    console.log('无效选择。');
    rl.close();
    process.exit(1);
  }

  const newRegular = {};

  console.log('\n请输入下月排班（格式：二下午=东城，三上午=博爱堂，...）');
  console.log('直接回车结束输入，输入 "q" 退出\n');

  function askSchedule() {
    rl.question('排班（如"二下午=东城"）：', (answer) => {
      if (!answer || answer.toLowerCase() === 'q') {
        if (answer && answer.toLowerCase() === 'q') {
          rl.close();
          process.exit(0);
        }
        askMonth();
        return;
      }

      const match = answer.match(/^(.+?)=(.+)$/);
      if (match) {
        newRegular[match[1].trim()] = match[2].trim();
        console.log('已添加:', match[1].trim(), '->', match[2].trim());
      } else {
        console.log('格式错误，请用"时间段=地点"格式');
      }
      askSchedule();
    });
  }

  function askMonth() {
    if (Object.keys(newRegular).length === 0) {
      console.log('\n没有输入任何排班，取消操作。');
      rl.close();
      process.exit(0);
    }

    rl.question('\n下月月份（如 2026-11）：', (month) => {
      if (!month) {
        console.log('月份不能为空。');
        rl.close();
        process.exit(1);
      }

      rl.question('特殊日期（如 2026-11-05=停诊，或 2026-11-15=日上午:东城,日下午:博爱堂，多个用逗号分隔，直接回车跳过）：', (exceptions) => {
        const exc = {};
        if (exceptions) {
          exceptions.split(',').forEach(item => {
            const match = item.trim().match(/^(.+?)=(.+)$/);
            if (match) {
              const dateKey = match[1].trim();
              const val = match[2].trim();
              if (val.includes(':')) {
                exc[dateKey] = {};
                val.split(',').forEach(slot => {
                  const sm = slot.trim().match(/^(.+?):(.+)$/);
                  if (sm) {
                    exc[dateKey][sm[1].trim()] = sm[2].trim();
                  }
                });
              } else {
                exc[dateKey] = val;
              }
            }
          });
        }

        data.next = {
          month: month.trim(),
          regular: newRegular,
          exceptions: exc
        };

        rl.close();
        fs.writeFileSync(schedulePath, JSON.stringify(data, null, 2) + '\n');
        console.log('\n已更新下月 (' + month.trim() + ') 排班到 next 字段。');
        console.log('本月 (' + data.month + ') 排班保持不变。');
        console.log('请运行以下命令提交：');
        console.log('  git add schedule.json');
        console.log('  git commit -m "添加' + month.trim() + '排班"');
        console.log('  git push origin main');
        process.exit(0);
      });
    });
  }

  askSchedule();
});
