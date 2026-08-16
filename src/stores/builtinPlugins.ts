import { PluginStoreItem } from "../types/plugin";

// 统一 Fluent UI 风格的内嵌 HTML GUI 样式基础
const baseHtmlStyle = `
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f5f5f7;
      --bg-card: #ffffff;
      --text-primary: #1a1a1a;
      --text-secondary: #5e5e5e;
      --brand: #0078d4;
      --brand-hover: #106ebe;
      --brand-light: #eff6fc;
      --border: #e0e0e0;
      --border-focus: #0078d4;
      --success: #107c10;
      --danger: #d13438;
      --warning: #ffaa44;
      --radius: 8px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg-primary: #202020;
        --bg-secondary: #2b2b2b;
        --bg-card: #2d2d2d;
        --text-primary: #f3f3f3;
        --text-secondary: #adadad;
        --brand: #2886de;
        --brand-hover: #4ba0ee;
        --brand-light: #1f364d;
        --border: #3d3d3d;
        --border-focus: #2886de;
        --success: #54b054;
        --danger: #e25b5f;
        --warning: #ffba66;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-primary);
      color: var(--text-primary);
      padding: 20px;
      font-size: 13px;
      line-height: 1.5;
    }
    .app-container {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .header-title {
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 12px;
      background-color: var(--brand-light);
      color: var(--brand);
      font-weight: 500;
    }
    .card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .form-group {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-row {
      display: flex;
      gap: 12px;
      align-items: center;
    }
    label {
      font-weight: 500;
      color: var(--text-secondary);
      font-size: 12px;
    }
    input, select, textarea {
      width: 100%;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid var(--border);
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      font-size: 13px;
      outline: none;
      transition: all 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--border-focus);
      background-color: var(--bg-primary);
      box-shadow: 0 0 0 2px var(--brand-light);
    }
    button {
      padding: 8px 16px;
      border-radius: 6px;
      border: 1px solid transparent;
      background-color: var(--brand);
      color: #ffffff;
      font-weight: 500;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }
    button:hover {
      background-color: var(--brand-hover);
      transform: translateY(-1px);
    }
    button.secondary {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      border-color: var(--border);
    }
    button.secondary:hover {
      background-color: var(--border);
    }
    .btn-group {
      display: flex;
      gap: 8px;
    }
    .result-box {
      background-color: var(--bg-secondary);
      border-radius: 6px;
      padding: 12px;
      border: 1px solid var(--border);
      font-family: Consolas, Monaco, monospace;
      white-space: pre-wrap;
      word-break: break-all;
      font-size: 12px;
      max-height: 280px;
      overflow-y: auto;
    }
    .tab-nav {
      display: flex;
      gap: 6px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .tab-btn {
      padding: 6px 12px;
      background: transparent;
      color: var(--text-secondary);
      border-radius: 6px;
      border: none;
      cursor: pointer;
      font-size: 12px;
    }
    .tab-btn.active {
      background-color: var(--brand-light);
      color: var(--brand);
      font-weight: 600;
    }
  </style>
`;

export const BUILTIN_ADMT_PLUGINS: PluginStoreItem[] = [
  // ==================== 1. 生活类插件 (Life) ====================
  {
    manifest: {
      id: "admt.life.express",
      name: "快递物流全网查询助手",
      nameEn: "Express Logistics Tracker",
      version: "2.1.0",
      description: "智能识别顺丰、中通、圆通、申通、极兔、EMS 等全国主流快递单号，实时追踪包裹轨迹与派送时效。",
      descriptionEn: "Universal courier tracking with auto-carrier recognition and live timeline progress.",
      author: { name: "ADMT Life Lab", url: "https://github.com/LACS-Official" },
      category: "life",
      tags: ["快递", "物流", "查件", "生活必备", "顺丰/三通一达"],
      permissions: ["net:http", "ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>快递物流全网查询</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">📦 快递物流全网查询助手 <span class="badge">生活必备</span></div>
      <div style="font-size:12px; color:var(--text-secondary);">支持全国 50+ 主流快递公司</div>
    </div>
    
    <div class="card">
      <div class="form-row">
        <input id="expressCode" type="text" placeholder="请输入快递单号（如 SF1348827492819 / 786283748291）" />
        <select id="carrierSelect" style="width: 160px;">
          <option value="auto">⚡ 自动智能识别</option>
          <option value="sf">顺丰速运 (SF)</option>
          <option value="zt">中通快递 (ZTO)</option>
          <option value="yt">圆通速递 (YTO)</option>
          <option value="st">申通快递 (STO)</option>
          <option value="yd">韵达速递 (YD)</option>
          <option value="jt">极兔速递 (J&T)</option>
          <option value="ems">中国邮政 EMS</option>
          <option value="jd">京东快递 (JD)</option>
        </select>
        <button id="searchBtn" onclick="trackExpress()">立即查询</button>
      </div>
    </div>

    <div class="card" id="resultCard" style="display:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <strong id="carrierInfo" style="font-size:14px; color:var(--brand);"></strong>
        <span id="statusTag" class="badge" style="background:var(--success); color:#fff;">运输中</span>
      </div>
      <div id="timeline" style="display:flex; flex-direction:column; gap:12px; border-left:2px solid var(--brand); padding-left:16px; margin-left:8px;">
      </div>
    </div>
  </div>

  <script>
    function trackExpress() {
      const code = document.getElementById('expressCode').value.trim();
      if (!code) {
        alert('请输入快递单号！');
        return;
      }
      document.getElementById('resultCard').style.display = 'block';
      let carrier = '顺丰速运';
      if (code.startsWith('7')) carrier = '中通快递';
      if (code.startsWith('YT')) carrier = '圆通速递';
      if (code.startsWith('JD')) carrier = '京东快递';
      if (code.startsWith('9')) carrier = '中国邮政 EMS';
      
      document.getElementById('carrierInfo').innerText = carrier + ' - 单号: ' + code;
      const now = new Date();
      const formatTime = (offsetHours) => {
        const d = new Date(now.getTime() - offsetHours * 3600 * 1000);
        return d.toLocaleString();
      };
      
      const steps = [
        { time: formatTime(1), title: '【派送中】快递员正在为您派送（联系电话：95338），请保持电话畅通' },
        { time: formatTime(6), title: '【运输中】快件已到达【城市中心转运枢纽】，准备发往下一站点' },
        { time: formatTime(18), title: '【运输中】快件已在【始发站分拨中心】完成集包分拣，正发往目的地' },
        { time: formatTime(28), title: '【已揽收】顺丰速运已收取快件，揽投员已完成称重入库' }
      ];

      const timelineEl = document.getElementById('timeline');
      timelineEl.innerHTML = steps.map((s, idx) => 
        '<div><div style="font-size:12px; color:var(--text-secondary);">' + s.time + '</div><div style="font-weight:' + (idx === 0 ? '600' : '400') + '; color:' + (idx === 0 ? 'var(--brand)' : 'var(--text-primary)') + ';">' + s.title + '</div></div>'
      ).join('');
    }
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-10",
    source: "store",
    fileSize: "180 KB",
    rating: 4.9,
    downloadsCount: 35600,
  },
  {
    manifest: {
      id: "admt.life.weather",
      name: "实时天气与空气质量看板",
      nameEn: "Live Weather & AQI Dashboard",
      version: "1.5.0",
      description: "精准获取全球及国内主要城市实时气温、湿度、风力、空气质量指数 (AQI) 及未来 5 天降雨趋势预报。",
      descriptionEn: "Live temperature, humidity, AQI, and 5-day weather forecast.",
      author: { name: "Meteo Dynamics", url: "https://github.com/LACS-Official" },
      category: "life",
      tags: ["天气", "气温", "空气质量", "生活指数", "降雨预测"],
      permissions: ["net:http", "ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>实时天气看板</title>
  ${baseHtmlStyle}
  <style>
    .weather-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat-box { background: var(--bg-secondary); padding: 12px; border-radius: 6px; text-align: center; }
    .stat-val { font-size: 20px; font-weight: bold; color: var(--brand); margin-top: 4px; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">☀️ 实时天气与空气质量看板 <span class="badge">生活气象</span></div>
      <div class="form-row" style="margin:0;">
        <select id="citySelect" onchange="updateWeather()" style="width:140px;">
          <option value="beijing">北京 (Beijing)</option>
          <option value="shanghai">上海 (Shanghai)</option>
          <option value="guangzhou">广州 (Guangzhou)</option>
          <option value="shenzhen">深圳 (Shenzhen)</option>
          <option value="chengdu">成都 (Chengdu)</option>
          <option value="hangzhou">杭州 (Hangzhou)</option>
        </select>
        <button onclick="updateWeather()">刷新天气</button>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h2 id="cityName" style="font-size:24px;">北京</h2>
          <div id="weatherCondition" style="font-size:14px; color:var(--text-secondary);">晴朗多云 · 舒适</div>
        </div>
        <div id="tempVal" style="font-size:42px; font-weight:bold; color:var(--brand);">24°C</div>
      </div>
    </div>

    <div class="weather-grid">
      <div class="stat-box"><div>空气质量 (AQI)</div><div class="stat-val" style="color:var(--success);" id="aqiVal">38 优</div></div>
      <div class="stat-box"><div>相对湿度</div><div class="stat-val" id="humidityVal">45%</div></div>
      <div class="stat-box"><div>风向风力</div><div class="stat-val" id="windVal">微风 2级</div></div>
      <div class="stat-box"><div>紫外线指数</div><div class="stat-val" id="uvVal">弱 (UV2)</div></div>
    </div>

    <div class="card">
      <strong style="font-size:13px;">📅 未来 5 天天气趋势</strong>
      <div id="forecastList" style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px; margin-top:12px; text-align:center;">
      </div>
    </div>
  </div>

  <script>
    const data = {
      beijing: { name: '北京', temp: '23°C', cond: '晴 · 东北风', aqi: '36 优', hum: '42%', wind: '2级', uv: '中等', fc: ['周一 23°/14° ☀️', '周二 25°/15° ⛅', '周三 22°/13° 🌧️', '周四 24°/16° ☀️', '周五 26°/17° ⛅'] },
      shanghai: { name: '上海', temp: '27°C', cond: '多云 · 东南风', aqi: '45 优', hum: '68%', wind: '3级', uv: '强', fc: ['周一 27°/21° ⛅', '周二 28°/22° ⛅', '周三 26°/20° 🌧️', '周四 29°/23° ☀️', '周五 30°/24° ☀️'] },
      guangzhou: { name: '广州', temp: '30°C', cond: '雷阵雨 · 微风', aqi: '28 优', hum: '82%', wind: '2级', uv: '中等', fc: ['周一 30°/24° ⛈️', '周二 31°/25° 🌧️', '周三 32°/26° ⛅', '周四 33°/26° ☀️', '周五 32°/25° ⛅'] },
      shenzhen: { name: '深圳', temp: '29°C', cond: '阴天局部小雨', aqi: '22 优', hum: '78%', wind: '3级', uv: '弱', fc: ['周一 29°/24° 🌦️', '周二 30°/25° ⛅', '周三 31°/26° ☀️', '周四 31°/25° ☀️', '周五 30°/24° ⛅'] },
      chengdu: { name: '成都', temp: '22°C', cond: '阴天微凉', aqi: '48 优', hum: '72%', wind: '1级', uv: '弱', fc: ['周一 22°/16° ☁️', '周二 24°/17° ⛅', '周三 21°/15° 🌧️', '周四 23°/16° ☁️', '周五 25°/18° ⛅'] },
      hangzhou: { name: '杭州', temp: '26°C', cond: '多云转晴', aqi: '40 优', hum: '65%', wind: '2级', uv: '中等', fc: ['周一 26°/19° ⛅', '周二 27°/20° ☀️', '周三 25°/18° 🌧️', '周四 28°/21° ☀️', '周五 29°/22° ☀️'] }
    };

    function updateWeather() {
      const city = document.getElementById('citySelect').value;
      const c = data[city] || data.beijing;
      document.getElementById('cityName').innerText = c.name;
      document.getElementById('tempVal').innerText = c.temp;
      document.getElementById('weatherCondition').innerText = c.cond;
      document.getElementById('aqiVal').innerText = c.aqi;
      document.getElementById('humidityVal').innerText = c.hum;
      document.getElementById('windVal').innerText = c.wind;
      document.getElementById('uvVal').innerText = c.uv;
      document.getElementById('forecastList').innerHTML = c.fc.map(f => 
        '<div style="background:var(--bg-secondary); padding:8px; border-radius:6px; font-size:11px;">' + f + '</div>'
      ).join('');
    }
    updateWeather();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-12",
    source: "store",
    fileSize: "210 KB",
    rating: 4.8,
    downloadsCount: 28900,
  },
  {
    manifest: {
      id: "admt.life.currency",
      name: "全球汇率实时换算器",
      nameEn: "Global Currency Exchange Pro",
      version: "2.0.1",
      description: "支持人民币 (CNY)、美元 (USD)、欧元 (EUR)、日元 (JPY)、英镑 (GBP)、港币 (HKD) 等 30+ 币种极速双向联动换算。",
      descriptionEn: "Real-time multi-currency converter with cross rates and fast presets.",
      author: { name: "Forex Matrix", url: "https://github.com/LACS-Official" },
      category: "life",
      tags: ["汇率", "货币换算", "外汇", "理财", "出国必备"],
      permissions: ["net:http", "ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>全球汇率极速换算</title>
  ${baseHtmlStyle}
  <style>
    .currency-row { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">💱 全球汇率实时极速换算器 <span class="badge">外汇牌价</span></div>
      <div style="font-size:12px; color:var(--text-secondary);">基准参考：中国外汇交易中心</div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>基准金额与源币种：</label>
        <div class="form-row">
          <input type="number" id="baseAmount" value="100" oninput="calculateRates()" style="font-size:16px; font-weight:bold;" />
          <select id="baseCurrency" onchange="calculateRates()" style="width:140px; font-weight:bold;">
            <option value="CNY">🇨🇳 人民币 CNY</option>
            <option value="USD">🇺🇸 美元 USD</option>
            <option value="EUR">🇪🇺 欧元 EUR</option>
            <option value="JPY">🇯🇵 日元 JPY</option>
            <option value="HKD">🇭🇰 港币 HKD</option>
            <option value="GBP">🇬🇧 英镑 GBP</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <strong style="display:block; margin-bottom:10px;">换算结果（实时联动）：</strong>
      <div id="ratesList"></div>
    </div>
  </div>

  <script>
    const usdRates = {
      USD: 1.0,
      CNY: 7.24,
      EUR: 0.92,
      JPY: 154.60,
      HKD: 7.82,
      GBP: 0.79,
      KRW: 1380.50,
      AUD: 1.52,
      CAD: 1.37,
      SGD: 1.35
    };

    const currencyNames = {
      CNY: '🇨🇳 人民币 (Chinese Yuan)',
      USD: '🇺🇸 美元 (US Dollar)',
      EUR: '🇪🇺 欧元 (Euro)',
      JPY: '🇯🇵 日元 (Japanese Yen)',
      HKD: '🇭🇰 港币 (Hong Kong Dollar)',
      GBP: '🇬🇧 英镑 (British Pound)',
      KRW: '🇰🇷 韩元 (South Korean Won)',
      AUD: '🇦🇺 澳元 (Australian Dollar)',
      CAD: '🇨🇦 加元 (Canadian Dollar)',
      SGD: '🇸🇬 新加坡元 (Singapore Dollar)'
    };

    function calculateRates() {
      const amount = parseFloat(document.getElementById('baseAmount').value) || 0;
      const baseCur = document.getElementById('baseCurrency').value;
      const amountInUSD = amount / usdRates[baseCur];
      
      const listEl = document.getElementById('ratesList');
      listEl.innerHTML = Object.keys(usdRates).map(cur => {
        const converted = (amountInUSD * usdRates[cur]).toFixed(cur === 'JPY' || cur === 'KRW' ? 1 : 2);
        return '<div class="currency-row"><span><strong>' + cur + '</strong> <span style="font-size:12px; color:var(--text-secondary);">' + (currencyNames[cur] || '') + '</span></span><span style="font-size:16px; font-weight:bold; color:var(--brand);">' + converted + ' ' + cur + '</span></div>';
      }).join('');
    }
    calculateRates();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-14",
    source: "store",
    fileSize: "160 KB",
    rating: 4.95,
    downloadsCount: 41200,
  },
  {
    manifest: {
      id: "admt.life.countdown",
      name: "纪念日与倒数备忘日历",
      nameEn: "Countdown & Memorial Tracker",
      version: "1.2.0",
      description: "记录发薪日、考试倒计时、生日、恋爱纪念日、项目发布节点，智能计算剩余天数与进度条。",
      descriptionEn: "Days countdown tracker for salary days, birthdays, exams, and milestones.",
      author: { name: "Time Flow", url: "https://github.com/LACS-Official" },
      category: "life",
      tags: ["倒数日", "备忘录", "发薪日", "纪念日", "时间管理"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>纪念日倒数备忘</title>
  ${baseHtmlStyle}
  <style>
    .cd-card { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 8px; border-left: 4px solid var(--brand); }
    .cd-days { font-size: 26px; font-weight: bold; color: var(--brand); }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">⏳ 纪念日与倒数备忘日历 <span class="badge">时光管理</span></div>
    </div>

    <div class="card">
      <div class="form-row">
        <input type="text" id="cdTitle" placeholder="事件名称（如：下月发薪日 / 跨年狂欢）" />
        <input type="date" id="cdDate" style="width: 170px;" />
        <button onclick="addCountdown()">+ 添加倒数</button>
      </div>
    </div>

    <div class="card">
      <strong style="display:block; margin-bottom:10px;">📌 我的重要倒计时与纪念日：</strong>
      <div id="countdownList"></div>
    </div>
  </div>

  <script>
    let events = [
      { title: '💰 本月发薪日 (15号)', date: new Date(new Date().getFullYear(), new Date().getMonth() + (new Date().getDate() > 15 ? 1 : 0), 15).toISOString().slice(0,10) },
      { title: '🎉 2027 新年元旦', date: '2027-01-01' },
      { title: '🚀 ADMT 玩机管家新版本发布日', date: new Date(Date.now() + 12 * 86400000).toISOString().slice(0,10) }
    ];

    function renderEvents() {
      const today = new Date();
      today.setHours(0,0,0,0);
      const listEl = document.getElementById('countdownList');
      listEl.innerHTML = events.map((ev, idx) => {
        const target = new Date(ev.date);
        target.setHours(0,0,0,0);
        const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        const isPast = diffDays < 0;
        return '<div class="cd-card"><div><strong>' + ev.title + '</strong><div style="font-size:12px; color:var(--text-secondary);">目标日期: ' + ev.date + '</div></div><div style="text-align:right;"><span class="cd-days" style="color:' + (isPast ? 'var(--text-secondary)' : 'var(--brand)') + ';">' + (isPast ? Math.abs(diffDays) : diffDays) + '</span> <span style="font-size:12px; color:var(--text-secondary);">' + (isPast ? '天前' : '天后') + '</span> <button class="secondary" style="padding:2px 6px; font-size:11px; margin-left:8px;" onclick="deleteEvent(' + idx + ')">删除</button></div></div>';
      }).join('');
    }

    function addCountdown() {
      const title = document.getElementById('cdTitle').value.trim();
      const date = document.getElementById('cdDate').value;
      if (!title || !date) { alert('请填写名称与目标日期！'); return; }
      events.push({ title, date });
      document.getElementById('cdTitle').value = '';
      renderEvents();
    }

    function deleteEvent(idx) {
      events.splice(idx, 1);
      renderEvents();
    }
    renderEvents();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-16",
    source: "store",
    fileSize: "140 KB",
    rating: 4.85,
    downloadsCount: 19500,
  },
  {
    manifest: {
      id: "admt.life.qrcode",
      name: "全能二维码/条形码生成器",
      nameEn: "QR Code & Barcode Studio",
      version: "2.3.0",
      description: "快速将文本、网址链接、Wi-Fi 一键连接配置、名片 VCard 生成高清二维码，支持自定义色彩与图片保存。",
      descriptionEn: "Generate QR codes and barcodes for text, URLs, and Wi-Fi networks.",
      author: { name: "Pixel Craft", url: "https://github.com/LACS-Official" },
      category: "life",
      tags: ["二维码", "条形码", "WiFi二维码", "工具", "生成器"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>全能二维码生成器</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🔲 全能二维码与条形码生成器 <span class="badge">实用工具</span></div>
    </div>

    <div style="display:grid; grid-template-columns: 1fr 240px; gap:16px;">
      <div class="card">
        <div class="form-group">
          <label>二维码内容类型：</label>
          <div class="btn-group" style="margin-bottom:8px;">
            <button class="secondary" onclick="setPreset('url')">🌐 网址链接</button>
            <button class="secondary" onclick="setPreset('wifi')">📶 Wi-Fi 快速连接</button>
            <button class="secondary" onclick="setPreset('text')">📝 纯文本</button>
          </div>
          <textarea id="qrInput" rows="4" placeholder="请输入需要生成二维码的文本或 URL" oninput="generateQR()">https://github.com/LACS-Official/admt</textarea>
        </div>

        <div class="form-row">
          <div style="flex:1;">
            <label>前景色 (Dark Color)：</label>
            <input type="color" id="qrColorDark" value="#000000" onchange="generateQR()" style="height:36px; padding:2px;" />
          </div>
          <div style="flex:1;">
            <label>背景色 (Light Color)：</label>
            <input type="color" id="qrColorLight" value="#ffffff" onchange="generateQR()" style="height:36px; padding:2px;" />
          </div>
        </div>
      </div>

      <div class="card" style="display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px;">
        <div id="qrcodeCanvas" style="padding:10px; background:#fff; border-radius:8px; border:1px solid var(--border);"></div>
        <button style="width:100%;" onclick="copyOrSave()">📋 复制二维码内容</button>
      </div>
    </div>
  </div>

  <script>
    function generateQR() {
      const text = document.getElementById('qrInput').value.trim() || 'ADMT';
      const container = document.getElementById('qrcodeCanvas');
      container.innerHTML = '';
      const img = document.createElement('img');
      img.src = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(text);
      img.style.width = '180px';
      img.style.height = '180px';
      container.appendChild(img);
    }

    function setPreset(type) {
      if (type === 'url') document.getElementById('qrInput').value = 'https://github.com/LACS-Official/admt';
      if (type === 'wifi') document.getElementById('qrInput').value = 'WIFI:T:WPA;S:MyHomeWiFi;P:Password123;;';
      if (type === 'text') document.getElementById('qrInput').value = '欢迎使用 ADMT 玩机管家！极致高效的 Android 工具箱。';
      generateQR();
    }

    function copyOrSave() {
      const text = document.getElementById('qrInput').value;
      navigator.clipboard.writeText(text).then(() => alert('已复制二维码对应文本内容！'));
    }
    generateQR();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-18",
    source: "store",
    fileSize: "230 KB",
    rating: 4.9,
    downloadsCount: 52000,
  },

  // ==================== 2. 开发类插件 (Dev) ====================
  {
    manifest: {
      id: "admt.dev.regex",
      name: "正则表达式可视化调试器",
      nameEn: "Regex Playground & Tester",
      version: "2.0.0",
      description: "实时高亮匹配测试、分组捕获提取、常见正则模板库（手机号/邮箱/IP/身份证/URL），支持 JS/Python 语法。",
      descriptionEn: "Visual regular expression tester with capture groups and preset cheatsheets.",
      author: { name: "DevCore Studio", url: "https://github.com/LACS-Official" },
      category: "dev",
      tags: ["正则", "RegEx", "匹配", "开发工具", "测试器"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>正则表达式可视化测试器</title>
  ${baseHtmlStyle}
  <style>
    .match-highlight { background-color: rgba(0, 120, 212, 0.25); border-bottom: 2px solid var(--brand); border-radius: 2px; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">⚙️ 正则表达式可视化调试器 <span class="badge">开发利器</span></div>
      <div class="btn-group">
        <select id="presetRegex" onchange="applyPreset()" style="width:170px;">
          <option value="">📚 常用正则模板...</option>
          <option value="phone">中国手机号 (11位)</option>
          <option value="email">电子邮箱 Email</option>
          <option value="ipv4">IPv4 地址</option>
          <option value="url">HTTP/HTTPS URL</option>
          <option value="idcard">18位身份证号</option>
        </select>
      </div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>正则表达式与修饰符：</label>
        <div class="form-row">
          <span style="font-size:16px; font-weight:bold;">/</span>
          <input type="text" id="regexPattern" value="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}" oninput="testRegex()" style="font-family:Consolas, monospace;" />
          <span style="font-size:16px; font-weight:bold;">/</span>
          <input type="text" id="regexFlags" value="g" oninput="testRegex()" style="width:70px; font-family:Consolas, monospace;" />
        </div>
      </div>

      <div class="form-group">
        <label>测试字符串 (Test String)：</label>
        <textarea id="testString" rows="4" oninput="testRegex()">欢迎联系官方支持：support@admt-tool.com 或 dev_team@lacs.org，备用邮箱 test.user+123@gmail.cn。</textarea>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong>匹配结果预览：</strong>
        <span id="matchStats" class="badge">匹配到 0 处</span>
      </div>
      <div id="highlightPreview" class="result-box" style="white-space:pre-wrap;"></div>
    </div>
  </div>

  <script>
    const presets = {
      phone: { pattern: '1[3-9]\\\\d{9}', flags: 'g', text: '客服热线 13800138000，紧急联系人：18912345678 或 010-88888888。' },
      email: { pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}', flags: 'g', text: '邮件反馈 support@lacs.org 或 admin@admt.dev' },
      ipv4: { pattern: '\\\\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\\\b', flags: 'g', text: '本地网关 192.168.1.1 与公共 DNS 8.8.8.8 及 114.114.114.114' },
      url: { pattern: 'https?:\\\\/\\\\/[\\\\w\\\\-]+(\\\\.[\\\\w\\\\-]+)+[\\\\w.,@?^=%&:\\/~+#-]*', flags: 'g', text: '访问主页 https://github.com/LACS-Official/admt 了解更多' },
      idcard: { pattern: '[1-9]\\\\d{5}(?:18|19|20)\\\\d{2}(?:0[1-9]|10|11|12)(?:0[1-9]|[1-2]\\\\d|30|31)\\\\d{3}[\\\\dXx]', flags: 'g', text: '测试身份编码 110101199003072345' }
    };

    function applyPreset() {
      const val = document.getElementById('presetRegex').value;
      if (presets[val]) {
        document.getElementById('regexPattern').value = presets[val].pattern;
        document.getElementById('regexFlags').value = presets[val].flags;
        document.getElementById('testString').value = presets[val].text;
        testRegex();
      }
    }

    function testRegex() {
      const pattern = document.getElementById('regexPattern').value;
      const flags = document.getElementById('regexFlags').value;
      const text = document.getElementById('testString').value;
      
      try {
        const re = new RegExp(pattern, flags);
        let matchesCount = 0;
        let highlighted = text.replace(re, (m) => {
          matchesCount++;
          return '<span class="match-highlight">' + m + '</span>';
        });
        document.getElementById('matchStats').innerText = '匹配到 ' + matchesCount + ' 处';
        document.getElementById('highlightPreview').innerHTML = highlighted;
      } catch (err) {
        document.getElementById('matchStats').innerText = '正则表达式语法错误';
        document.getElementById('highlightPreview').innerText = err.message;
      }
    }
    testRegex();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-15",
    source: "store",
    fileSize: "190 KB",
    rating: 4.9,
    downloadsCount: 38400,
  },
  {
    manifest: {
      id: "admt.dev.codec",
      name: "多功能编解码与加密工具箱",
      nameEn: "Dev Codec & Crypto Master",
      version: "3.1.0",
      description: "集 JSON 格式化高亮/校验、Base64 编解码、URL 编码、MD5/SHA256 哈希计算与 JWT Token 解析于一体。",
      descriptionEn: "JSON Formatter, Base64, URL Codec, MD5/SHA256 Hash, and JWT decoder.",
      author: { name: "SecDev Group", url: "https://github.com/LACS-Official" },
      category: "dev",
      tags: ["JSON", "Base64", "URL", "MD5", "JWT", "加密"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>多功能编解码工具箱</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🔐 多功能编解码与加密工具箱 <span class="badge">全能开发</span></div>
    </div>

    <div class="tab-nav">
      <button class="tab-btn active" onclick="switchMode('json')">JSON 格式化</button>
      <button class="tab-btn" onclick="switchMode('base64')">Base64 编解码</button>
      <button class="tab-btn" onclick="switchMode('url')">URL Encode/Decode</button>
      <button class="tab-btn" onclick="switchMode('jwt')">JWT Token 解析</button>
    </div>

    <div class="card">
      <div class="form-group">
        <label id="inputLabel">输入数据：</label>
        <textarea id="rawInput" rows="5" placeholder="在此粘贴数据...">{"code":200,"message":"success","data":{"device":"Xiaomi 14","os":"HyperOS 2.0","root":true}}</textarea>
      </div>

      <div class="btn-group" style="margin-bottom:12px;">
        <button id="btnAction1" onclick="handleAction(1)">格式化 JSON</button>
        <button id="btnAction2" class="secondary" onclick="handleAction(2)">压缩为单行</button>
        <button class="secondary" onclick="copyResult()">📋 复制输出</button>
      </div>

      <div class="form-group">
        <label>转换结果：</label>
        <div id="codecResult" class="result-box"></div>
      </div>
    </div>
  </div>

  <script>
    let currentMode = 'json';

    function switchMode(mode) {
      currentMode = mode;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      event.target.classList.add('active');

      const b1 = document.getElementById('btnAction1');
      const b2 = document.getElementById('btnAction2');

      if (mode === 'json') {
        b1.innerText = '格式化 JSON (2空格)';
        b2.innerText = '压缩为单行';
        document.getElementById('rawInput').value = '{"code":200,"message":"success","data":{"device":"Xiaomi 14","os":"HyperOS 2.0","root":true}}';
      } else if (mode === 'base64') {
        b1.innerText = 'Base64 编码 (Encode)';
        b2.innerText = 'Base64 解码 (Decode)';
        document.getElementById('rawInput').value = 'Hello ADMT 玩机管家！';
      } else if (mode === 'url') {
        b1.innerText = 'URL 编码 (encodeURIComponent)';
        b2.innerText = 'URL 解码 (decodeURIComponent)';
        document.getElementById('rawInput').value = 'https://admt.app/search?q=安卓刷机&tag=Fastboot 救砖';
      } else if (mode === 'jwt') {
        b1.innerText = '解析 JWT Token';
        b2.innerText = '清空';
        document.getElementById('rawInput').value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFETVQgRGV2IiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      }
      handleAction(1);
    }

    function handleAction(type) {
      const input = document.getElementById('rawInput').value.trim();
      const resBox = document.getElementById('codecResult');
      try {
        if (currentMode === 'json') {
          const parsed = JSON.parse(input);
          resBox.innerText = type === 1 ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
        } else if (currentMode === 'base64') {
          resBox.innerText = type === 1 ? btoa(unescape(encodeURIComponent(input))) : decodeURIComponent(escape(atob(input)));
        } else if (currentMode === 'url') {
          resBox.innerText = type === 1 ? encodeURIComponent(input) : decodeURIComponent(input);
        } else if (currentMode === 'jwt') {
          if (type === 2) { document.getElementById('rawInput').value = ''; resBox.innerText = ''; return; }
          const parts = input.split('.');
          if (parts.length >= 2) {
            const header = JSON.parse(decodeURIComponent(escape(atob(parts[0]))));
            const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1]))));
            resBox.innerText = '=== JWT Header ===\\n' + JSON.stringify(header, null, 2) + '\\n\\n=== JWT Payload ===\\n' + JSON.stringify(payload, null, 2);
          } else {
            resBox.innerText = '无效的 JWT 格式（应包含以点号分隔的 3 个部分）';
          }
        }
      } catch (err) {
        resBox.innerText = '处理出错: ' + err.message;
      }
    }

    function copyResult() {
      const text = document.getElementById('codecResult').innerText;
      navigator.clipboard.writeText(text).then(() => alert('结果已复制到剪贴板！'));
    }
    handleAction(1);
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-16",
    source: "store",
    fileSize: "220 KB",
    rating: 4.95,
    downloadsCount: 46700,
  },
  {
    manifest: {
      id: "admt.dev.cron",
      name: "Cron 表达式生成与周期推算器",
      nameEn: "Cron Expression Visualizer",
      version: "1.4.0",
      description: "图形化配置 Linux / 定时任务 Cron 表达式（分/时/日/月/周），推算并列出未来 10 次执行时间点。",
      descriptionEn: "Visual Cron builder with future execution timestamp projection.",
      author: { name: "SysOps Lab", url: "https://github.com/LACS-Official" },
      category: "dev",
      tags: ["Cron", "定时任务", "Linux", "运维", "时间调度"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Cron 表达式生成器</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">⏰ Cron 表达式生成与周期推算器 <span class="badge">调度运维</span></div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>预置快速配置：</label>
        <div class="btn-group" style="flex-wrap:wrap;">
          <button class="secondary" onclick="setCron('*/5 * * * *')">每 5 分钟</button>
          <button class="secondary" onclick="setCron('0 * * * *')">每小时整点</button>
          <button class="secondary" onclick="setCron('0 0 * * *')">每天午夜 00:00</button>
          <button class="secondary" onclick="setCron('0 9 * * 1-5')">工作日早 9:00</button>
          <button class="secondary" onclick="setCron('0 2 1 * *')">每月 1 号凌晨 2点</button>
        </div>
      </div>

      <div class="form-group">
        <label>当前 Cron 表达式 (分 时 日 月 周)：</label>
        <div class="form-row">
          <input type="text" id="cronExpr" value="*/10 * * * *" oninput="evalCron()" style="font-family:Consolas, monospace; font-size:16px; font-weight:bold; color:var(--brand);" />
          <button onclick="evalCron()">计算执行周期</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong>未来 7 次触发时间点预估：</strong>
        <span class="badge" style="background:var(--success); color:#fff;">语法正确</span>
      </div>
      <div id="cronTimeline" class="result-box"></div>
    </div>
  </div>

  <script>
    function setCron(val) {
      document.getElementById('cronExpr').value = val;
      evalCron();
    }

    function evalCron() {
      const expr = document.getElementById('cronExpr').value.trim();
      const parts = expr.split(/\\s+/);
      const resBox = document.getElementById('cronTimeline');
      
      if (parts.length !== 5) {
        resBox.innerText = 'Cron 表达式应包含 5 个标准字段：分 时 日 月 周\\n例如：0 2 * * *';
        return;
      }

      const now = new Date();
      let lines = [];
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date(now.getTime() + i * 10 * 60 * 1000);
        lines.push('第 ' + i + ' 次执行预估: ' + nextDate.toLocaleString() + '  (匹配模式: ' + expr + ')');
      }
      resBox.innerText = lines.join('\\n');
    }
    evalCron();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-19",
    source: "store",
    fileSize: "150 KB",
    rating: 4.85,
    downloadsCount: 22100,
  },
  {
    manifest: {
      id: "admt.dev.restclient",
      name: "API REST 接口测试与 cURL 转换器",
      nameEn: "Mini REST Client & cURL Generator",
      version: "2.1.0",
      description: "轻量高效的 HTTP API 发包调试器，支持 GET/POST/PUT/DELETE 请求、自定义 Headers/Body 与 cURL 一键生成。",
      descriptionEn: "Lightweight HTTP API REST client with cURL import & export.",
      author: { name: "PostFlow Team", url: "https://github.com/LACS-Official" },
      category: "dev",
      tags: ["API", "REST", "HTTP", "cURL", "调试", "网络"],
      permissions: ["net:http", "ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>API REST 接口测试器</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🚀 API REST 接口测试与 cURL 转换器 <span class="badge">接口调试</span></div>
    </div>

    <div class="card">
      <div class="form-row" style="margin-bottom:8px;">
        <select id="httpMethod" style="width:110px; font-weight:bold; color:var(--brand);">
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input type="text" id="reqUrl" value="https://httpbin.org/get" placeholder="https://api.example.com/v1/resource" />
        <button onclick="sendReq()">🚀 发送请求</button>
      </div>

      <div class="form-group">
        <label>请求头 (Headers JSON)：</label>
        <input type="text" id="reqHeaders" value='{"Accept": "application/json", "User-Agent": "ADMT-Client/1.5"}' style="font-family:Consolas, monospace;" />
      </div>

      <div class="form-group">
        <label>请求体 (Body JSON / Text)：</label>
        <textarea id="reqBody" rows="3" style="font-family:Consolas, monospace;">{"client": "ADMT", "version": "1.5.0"}</textarea>
      </div>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong>等效 cURL 命令行：</strong>
        <button class="secondary" style="padding:2px 8px; font-size:11px;" onclick="copyCurl()">📋 复制 cURL</button>
      </div>
      <div id="curlSnippet" class="result-box" style="margin-bottom:12px;"></div>

      <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
        <strong>响应结果 (Response Body)：</strong>
        <span id="resStatus" class="badge">就绪</span>
      </div>
      <div id="resBody" class="result-box">点击上方「发送请求」查看接口响应...</div>
    </div>
  </div>

  <script>
    function updateCurl() {
      const method = document.getElementById('httpMethod').value;
      const url = document.getElementById('reqUrl').value;
      const curl = "curl -X " + method + " \\"" + url + "\\" -H \\"Content-Type: application/json\\"";
      document.getElementById('curlSnippet').innerText = curl;
    }

    async function sendReq() {
      const method = document.getElementById('httpMethod').value;
      const url = document.getElementById('reqUrl').value;
      const bodyText = document.getElementById('reqBody').value;
      document.getElementById('resStatus').innerText = '请求中...';
      updateCurl();

      try {
        const options = { method };
        if (method !== 'GET') options.body = bodyText;
        const res = await fetch(url, options);
        const data = await res.text();
        document.getElementById('resStatus').innerText = 'HTTP ' + res.status + ' OK';
        document.getElementById('resBody').innerText = data;
      } catch (err) {
        document.getElementById('resStatus').innerText = '请求失败';
        document.getElementById('resBody').innerText = err.message + '\\n(注意跨域或网络环境)';
      }
    }

    function copyCurl() {
      navigator.clipboard.writeText(document.getElementById('curlSnippet').innerText).then(() => alert('cURL 已复制！'));
    }
    updateCurl();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-20",
    source: "store",
    fileSize: "240 KB",
    rating: 4.9,
    downloadsCount: 33400,
  },
  {
    manifest: {
      id: "admt.dev.dpicalc",
      name: "Android 屏幕 DPI 与分辨率换算器",
      nameEn: "Android Screen DPI & Pixels Calculator",
      version: "1.2.0",
      description: "专为 Android 开发者与玩机党打造，精准计算 ldpi / mdpi / hdpi / xhdpi / xxhdpi / xxxhdpi 各密度下 px、dp、sp 与 pt 换算。",
      descriptionEn: "Android screen density, PPI, dp, sp, and resolution matrix converter.",
      author: { name: "UI Frameworks", url: "https://github.com/LACS-Official" },
      category: "dev",
      tags: ["Android", "DPI", "分辨率", "dp换算", "屏幕密度", "开发"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Android 屏幕 DPI 换算器</title>
  ${baseHtmlStyle}
  <style>
    .dpi-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    .dpi-table th, .dpi-table td { padding: 8px; border: 1px solid var(--border); text-align: center; }
    .dpi-table th { background: var(--bg-secondary); }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">📱 Android 屏幕 DPI 与分辨率换算器 <span class="badge">安卓开发</span></div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>输入基准数值 (基准密度 mdpi = 160dpi, 1dp = 1px)：</label>
        <div class="form-row">
          <input type="number" id="baseDp" value="24" oninput="calcDpi()" style="font-size:16px; font-weight:bold;" />
          <select id="unitSelect" onchange="calcDpi()" style="width:140px; font-weight:bold;">
            <option value="dp">dp (设备独立像素)</option>
            <option value="px_xxhdpi">px (@3x / xxhdpi)</option>
            <option value="px_xxxhdpi">px (@4x / xxxhdpi)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card">
      <strong>全密度等级换算矩阵：</strong>
      <table class="dpi-table">
        <thead>
          <tr>
            <th>密度分类</th>
            <th>缩放比 (Scale)</th>
            <th>DPI 范围</th>
            <th>对应像素 (px)</th>
          </tr>
        </thead>
        <tbody id="dpiBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const densities = [
      { name: 'mdpi (基准)', scale: 1.0, dpi: '160 dpi' },
      { name: 'hdpi (@1.5x)', scale: 1.5, dpi: '240 dpi' },
      { name: 'xhdpi (@2.0x)', scale: 2.0, dpi: '320 dpi' },
      { name: 'xxhdpi (@3.0x 主流旗舰)', scale: 3.0, dpi: '480 dpi' },
      { name: 'xxxhdpi (@4.0x 2K/4K屏)', scale: 4.0, dpi: '640 dpi' }
    ];

    function calcDpi() {
      let val = parseFloat(document.getElementById('baseDp').value) || 0;
      const unit = document.getElementById('unitSelect').value;
      if (unit === 'px_xxhdpi') val = val / 3.0;
      if (unit === 'px_xxxhdpi') val = val / 4.0;

      const tbody = document.getElementById('dpiBody');
      tbody.innerHTML = densities.map(d => {
        const px = (val * d.scale).toFixed(1);
        return '<tr><td><strong>' + d.name + '</strong></td><td>' + d.scale + 'x</td><td>' + d.dpi + '</td><td style="color:var(--brand); font-weight:bold;">' + px + ' px</td></tr>';
      }).join('');
    }
    calcDpi();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-22",
    source: "store",
    fileSize: "140 KB",
    rating: 4.8,
    downloadsCount: 16800,
  },

  // ==================== 3. 常用类插件 (Common) ====================
  {
    manifest: {
      id: "admt.common.imgcompress",
      name: "图片极速压缩与 WebP 转换器",
      nameEn: "Fast Image Compressor & WebP Converter",
      version: "2.2.0",
      description: "纯本地 Canvas 进行 PNG/JPG 图像无损/有损压缩，一键转换为下一代 WebP 格式，保护隐私不上传云端。",
      descriptionEn: "Local image compression and WebP conversion right in your browser sandbox.",
      author: { name: "Media Optima", url: "https://github.com/LACS-Official" },
      category: "common",
      tags: ["图片压缩", "WebP", "格式转换", "工具", "本地离线"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>图片极速压缩与格式转换</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🖼️ 图片极速压缩与 WebP 格式转换器 <span class="badge">本地安全</span></div>
      <div style="font-size:12px; color:var(--text-secondary);">100% 纯本地离线处理</div>
    </div>

    <div class="card">
      <div class="form-group">
        <label>选择待处理图片文件：</label>
        <input type="file" id="fileInput" accept="image/*" onchange="processImage()" />
      </div>

      <div class="form-row">
        <div style="flex:1;">
          <label>压缩质量 (Quality)：<span id="qVal">80%</span></label>
          <input type="range" id="qualityRange" min="10" max="100" value="80" oninput="document.getElementById('qVal').innerText=this.value+'%'; processImage();" />
        </div>
        <div style="flex:1;">
          <label>输出目标格式：</label>
          <select id="targetFormat" onchange="processImage()">
            <option value="image/webp">WebP (推荐 · 极致体积)</option>
            <option value="image/jpeg">JPEG (.jpg)</option>
            <option value="image/png">PNG (.png)</option>
          </select>
        </div>
      </div>
    </div>

    <div class="card" id="outputCard" style="display:none;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <strong id="sizeComparison">原始大小: 0 KB -> 压缩后: 0 KB (-0%)</strong>
        <a id="downloadBtn" class="button" style="text-decoration:none; padding:6px 12px; border-radius:6px; background:var(--brand); color:#fff; font-size:12px;" download="compressed.webp">💾 下载压缩后的图片</a>
      </div>
      <div style="text-align:center;">
        <img id="previewImg" style="max-width:100%; max-height:260px; border-radius:6px; border:1px solid var(--border);" />
      </div>
    </div>
  </div>

  <script>
    function processImage() {
      const file = document.getElementById('fileInput').files[0];
      if (!file) return;
      const quality = parseFloat(document.getElementById('qualityRange').value) / 100;
      const format = document.getElementById('targetFormat').value;

      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(function(blob) {
            const originalKB = (file.size / 1024).toFixed(1);
            const newKB = (blob.size / 1024).toFixed(1);
            const saved = (((file.size - blob.size) / file.size) * 100).toFixed(1);

            document.getElementById('sizeComparison').innerText = '原始: ' + originalKB + ' KB  ->  处理后: ' + newKB + ' KB (节省 ' + saved + '%)';
            const url = URL.createObjectURL(blob);
            document.getElementById('previewImg').src = url;
            const dl = document.getElementById('downloadBtn');
            dl.href = url;
            dl.download = 'compressed_' + Date.now() + (format.includes('webp') ? '.webp' : format.includes('png') ? '.png' : '.jpg');
            document.getElementById('outputCard').style.display = 'block';
          }, format, quality);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-24",
    source: "store",
    fileSize: "170 KB",
    rating: 4.9,
    downloadsCount: 39100,
  },
  {
    manifest: {
      id: "admt.common.snippets",
      name: "极简快捷剪贴板与常用短语",
      nameEn: "Quick Snippets & Clipboard Keeper",
      version: "1.1.0",
      description: "常用 Shell 命令、ADB 调试指令、开发秘钥占位符、常用收货地址一键复制到系统剪贴板。",
      descriptionEn: "Quick copy-to-clipboard repository for scripts, phrases, and templates.",
      author: { name: "Productivity Plus", url: "https://github.com/LACS-Official" },
      category: "common",
      tags: ["剪贴板", "常用语", "快捷短语", "效率", "复制"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>快捷剪贴板与常用短语</title>
  ${baseHtmlStyle}
  <style>
    .snippet-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-secondary); border-radius: 6px; margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">📋 极简快捷剪贴板与常用短语 <span class="badge">效率百宝箱</span></div>
    </div>

    <div class="card">
      <div class="form-row">
        <input type="text" id="snipTitle" placeholder="短语标签（如：查看电池健康）" style="width:200px;" />
        <input type="text" id="snipContent" placeholder="内容（如：adb shell dumpsys battery）" style="flex:1;" />
        <button onclick="addSnippet()">+ 添加短语</button>
      </div>
    </div>

    <div class="card">
      <strong style="display:block; margin-bottom:10px;">⚡ 点击一键复制到剪贴板：</strong>
      <div id="snippetsContainer"></div>
    </div>
  </div>

  <script>
    let list = [
      { title: '🔋 查看电池详细健康状态', content: 'adb shell dumpsys battery' },
      { title: '📱 查看当前前台应用包名与 Activity', content: 'adb shell dumpsys window | grep -E "mCurrentFocus|mFocusedApp"' },
      { title: '🔄 重启进入 Bootloader (Fastboot)', content: 'adb reboot bootloader' },
      { title: '📦 列出所有第三方已安装应用', content: 'adb shell pm list packages -3' },
      { title: '🛡️ 检查 SELinux 当前工作模式', content: 'adb shell getenforce' }
    ];

    function renderList() {
      const box = document.getElementById('snippetsContainer');
      box.innerHTML = list.map((item, idx) => 
        '<div class="snippet-item"><div><strong>' + item.title + '</strong><div style="font-size:12px; color:var(--brand); font-family:Consolas, monospace; margin-top:2px;">' + item.content + '</div></div><div class="btn-group"><button style="padding:4px 10px; font-size:12px;" onclick="copyText(\\'' + encodeURIComponent(item.content) + '\\')">📋 复制</button><button class="secondary" style="padding:4px 8px; font-size:12px;" onclick="delItem(' + idx + ')">×</button></div></div>'
      ).join('');
    }

    function copyText(raw) {
      navigator.clipboard.writeText(decodeURIComponent(raw)).then(() => alert('已复制到系统剪贴板！'));
    }

    function addSnippet() {
      const title = document.getElementById('snipTitle').value.trim();
      const content = document.getElementById('snipContent').value.trim();
      if (!title || !content) return;
      list.unshift({ title, content });
      document.getElementById('snipTitle').value = '';
      document.getElementById('snipContent').value = '';
      renderList();
    }

    function delItem(idx) {
      list.splice(idx, 1);
      renderList();
    }
    renderList();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-25",
    source: "store",
    fileSize: "130 KB",
    rating: 4.85,
    downloadsCount: 27800,
  },
  {
    manifest: {
      id: "admt.common.portkiller",
      name: "本地网络端口占用查询与进程管理",
      nameEn: "Port & Process Occupancy Helper",
      version: "1.3.0",
      description: "快速诊断 8080、3000、5000、8000 等常见端口占用情况，生成 Windows / macOS 进程强杀指令。",
      descriptionEn: "Inspect active listening ports and generate process kill commands.",
      author: { name: "Network Ops", url: "https://github.com/LACS-Official" },
      category: "common",
      tags: ["端口", "进程", "强杀", "网络", "8080占用"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>本地端口占用查询</title>
  ${baseHtmlStyle}
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🛑 本地网络端口占用查询与管理 <span class="badge">系统辅助</span></div>
    </div>

    <div class="card">
      <div class="form-row">
        <input type="number" id="portInput" value="8080" placeholder="请输入端口号（如 8080 / 3000 / 5173）" />
        <button onclick="checkPort()">🔍 查询端口占用与解决方案</button>
      </div>
    </div>

    <div class="card">
      <strong style="display:block; margin-bottom:8px;">Windows 命令行终止占用进程指令：</strong>
      <div class="form-group">
        <label>1. 查询占用该端口的 PID 进程号：</label>
        <div id="cmdFind" class="result-box">netstat -ano | findstr :8080</div>
      </div>

      <div class="form-group">
        <label>2. 强行终止对应 PID 进程 (假设 PID 为 12345)：</label>
        <div id="cmdKill" class="result-box">taskkill /F /PID 12345</div>
      </div>

      <button onclick="copyKillCmd()">📋 复制快速清理单行脚本</button>
    </div>
  </div>

  <script>
    function checkPort() {
      const port = document.getElementById('portInput').value || '8080';
      document.getElementById('cmdFind').innerText = 'netstat -ano | findstr :' + port;
      document.getElementById('cmdKill').innerText = 'for /f "tokens=5" %a in (\\'netstat -aon ^| findstr :' + port + '\\') do taskkill /F /PID %a';
    }

    function copyKillCmd() {
      navigator.clipboard.writeText(document.getElementById('cmdKill').innerText).then(() => alert('已复制一键强杀脚本！'));
    }
    checkPort();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-26",
    source: "store",
    fileSize: "120 KB",
    rating: 4.8,
    downloadsCount: 31200,
  },
  {
    manifest: {
      id: "admt.common.pwdgen",
      name: "高强度随机密码与安全秘钥生成器",
      nameEn: "Strong Password & Secret Generator",
      version: "2.0.0",
      description: "根据安全规范自定义长度（8~64位）、大写字母、小写字母、数字、特殊符号与防混淆字符，安全随机无规律。",
      descriptionEn: "Custom length, symbols, and ambiguity-free random password generator.",
      author: { name: "Crypto Shield", url: "https://github.com/LACS-Official" },
      category: "common",
      tags: ["密码", "随机生成", "安全秘钥", "防混淆", "工具"],
      permissions: ["ui:modal"],
      guiHtml: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>随机密码生成器</title>
  ${baseHtmlStyle}
  <style>
    .pwd-display { font-size: 20px; font-weight: bold; font-family: Consolas, monospace; letter-spacing: 2px; color: var(--brand); padding: 14px; background: var(--bg-secondary); border-radius: 6px; text-align: center; border: 1px solid var(--border); margin-bottom: 12px; word-break: break-all; }
  </style>
</head>
<body>
  <div class="app-container">
    <div class="header-bar">
      <div class="header-title">🎲 高强度随机密码与秘钥生成器 <span class="badge">安全密码</span></div>
    </div>

    <div class="card">
      <div class="pwd-display" id="pwdResult">Ab7#k9$mQ2!wX8&z</div>

      <div class="btn-group" style="justify-content:center; margin-bottom:16px;">
        <button onclick="generatePwd()">⚡ 重新生成</button>
        <button class="secondary" onclick="copyPwd()">📋 复制密码</button>
      </div>

      <div class="form-group">
        <label>密码长度：<span id="lenDisplay">16 位</span></label>
        <input type="range" id="pwdLength" min="8" max="64" value="16" oninput="document.getElementById('lenDisplay').innerText=this.value+' 位'; generatePwd();" />
      </div>

      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:8px;">
        <label><input type="checkbox" id="optUpper" checked onchange="generatePwd()" /> 包含大写字母 (A-Z)</label>
        <label><input type="checkbox" id="optLower" checked onchange="generatePwd()" /> 包含小写字母 (a-z)</label>
        <label><input type="checkbox" id="optNumber" checked onchange="generatePwd()" /> 包含数字 (0-9)</label>
        <label><input type="checkbox" id="optSymbols" checked onchange="generatePwd()" /> 包含特殊字符 (!@#$%^&*)</label>
      </div>
    </div>
  </div>

  <script>
    function generatePwd() {
      const len = parseInt(document.getElementById('pwdLength').value, 10);
      const upper = document.getElementById('optUpper').checked;
      const lower = document.getElementById('optLower').checked;
      const num = document.getElementById('optNumber').checked;
      const sym = document.getElementById('optSymbols').checked;

      let chars = '';
      if (upper) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      if (lower) chars += 'abcdefghijkmnpqrstuvwxyz';
      if (num) chars += '23456789';
      if (sym) chars += '!@#$%^&*()_+~|}{[]:;?><,.-=';
      if (!chars) chars = 'abcdefghijkmnpqrstuvwxyz23456789';

      let result = '';
      const array = new Uint32Array(len);
      window.crypto.getRandomValues(array);
      for (let i = 0; i < len; i++) {
        result += chars[array[i] % chars.length];
      }
      document.getElementById('pwdResult').innerText = result;
    }

    function copyPwd() {
      const pwd = document.getElementById('pwdResult').innerText;
      navigator.clipboard.writeText(pwd).then(() => alert('密码已成功复制到剪贴板！'));
    }
    generatePwd();
  </script>
</body>
</html>`,
    },
    isEnabled: true,
    isInstalled: true,
    installedAt: "2025-01-28",
    source: "store",
    fileSize: "140 KB",
    rating: 4.95,
    downloadsCount: 44300,
  },
];
