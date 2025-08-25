const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化数据库
const db = new sqlite3.Database('activation.db');

// 创建表
db.serialize(() => {
  // 激活码表
  db.run(`CREATE TABLE IF NOT EXISTS activation_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL,
    max_devices INTEGER DEFAULT 1,
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
  )`);

  // 设备绑定表
  db.run(`CREATE TABLE IF NOT EXISTS device_bindings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activation_code TEXT NOT NULL,
    device_id TEXT NOT NULL,
    device_info TEXT,
    activated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (activation_code) REFERENCES activation_codes (code)
  )`);

  // 插入示例激活码
  const sampleCodes = [
    { code: 'HOUT-2025-DEMO-001', type: 'demo', max_devices: 1, expires_at: '2025-12-31 23:59:59' },
    { code: 'HOUT-2025-TRIAL-001', type: 'trial', max_devices: 1, expires_at: '2025-02-26 23:59:59' },
    { code: 'HOUT-2025-FULL-001', type: 'full', max_devices: 3, expires_at: null },
    { code: 'HOUT-2025-ENTERPRISE-001', type: 'enterprise', max_devices: 10, expires_at: null }
  ];

  sampleCodes.forEach(codeData => {
    db.run(`INSERT OR IGNORE INTO activation_codes (code, type, max_devices, expires_at) 
            VALUES (?, ?, ?, ?)`, 
            [codeData.code, codeData.type, codeData.max_devices, codeData.expires_at]);
  });
});

// 生成设备指纹
function generateDeviceFingerprint(deviceInfo) {
  const data = JSON.stringify(deviceInfo);
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

// 验证激活码格式
function validateCodeFormat(code) {
  const pattern = /^HOUT-\d{4}-(DEMO|TRIAL|FULL|ENTERPRISE)-\d{3}$/;
  return pattern.test(code);
}

// 激活API
app.post('/api/activate', (req, res) => {
  const { activationCode, deviceInfo } = req.body;

  console.log('Activation request:', { activationCode, deviceInfo });

  // 验证请求参数
  if (!activationCode || !deviceInfo) {
    return res.status(400).json({
      success: false,
      message: '缺少必要参数'
    });
  }

  // 验证激活码格式
  if (!validateCodeFormat(activationCode)) {
    return res.status(400).json({
      success: false,
      message: '激活码格式不正确'
    });
  }

  const deviceId = generateDeviceFingerprint(deviceInfo);

  // 检查激活码是否存在且有效
  db.get(`SELECT * FROM activation_codes WHERE code = ? AND is_active = 1`, 
         [activationCode], (err, codeRow) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    if (!codeRow) {
      return res.status(400).json({
        success: false,
        message: '激活码无效或已被禁用'
      });
    }

    // 检查是否过期
    if (codeRow.expires_at && new Date(codeRow.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        message: '激活码已过期'
      });
    }

    // 检查设备是否已经绑定
    db.get(`SELECT * FROM device_bindings WHERE activation_code = ? AND device_id = ?`,
           [activationCode, deviceId], (err, existingBinding) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }

      if (existingBinding) {
        // 设备已绑定，更新最后访问时间
        db.run(`UPDATE device_bindings SET last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
               [existingBinding.id]);
        
        return res.json({
          success: true,
          message: '设备已激活',
          data: {
            type: codeRow.type,
            expiresAt: codeRow.expires_at,
            deviceId: deviceId,
            activatedAt: existingBinding.activated_at
          }
        });
      }

      // 检查激活码的设备数量限制
      db.get(`SELECT COUNT(*) as device_count FROM device_bindings WHERE activation_code = ?`,
             [activationCode], (err, countRow) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({
            success: false,
            message: '服务器内部错误'
          });
        }

        if (countRow.device_count >= codeRow.max_devices) {
          return res.status(400).json({
            success: false,
            message: `激活码已达到最大设备数量限制 (${codeRow.max_devices})`
          });
        }

        // 绑定新设备
        db.run(`INSERT INTO device_bindings (activation_code, device_id, device_info) 
                VALUES (?, ?, ?)`,
               [activationCode, deviceId, JSON.stringify(deviceInfo)], function(err) {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({
              success: false,
              message: '激活失败，请重试'
            });
          }

          res.json({
            success: true,
            message: '激活成功',
            data: {
              type: codeRow.type,
              expiresAt: codeRow.expires_at,
              deviceId: deviceId,
              activatedAt: new Date().toISOString()
            }
          });
        });
      });
    });
  });
});

// 验证设备状态API
app.post('/api/verify', (req, res) => {
  const { activationCode, deviceInfo } = req.body;
  const deviceId = generateDeviceFingerprint(deviceInfo);

  db.get(`SELECT ac.*, db.activated_at, db.last_seen 
          FROM activation_codes ac 
          JOIN device_bindings db ON ac.code = db.activation_code 
          WHERE ac.code = ? AND db.device_id = ? AND ac.is_active = 1`,
         [activationCode, deviceId], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器错误' });
    }

    if (!row) {
      return res.status(400).json({ success: false, message: '设备未激活' });
    }

    // 检查是否过期
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: '激活已过期' });
    }

    // 更新最后访问时间
    db.run(`UPDATE device_bindings SET last_seen = CURRENT_TIMESTAMP 
            WHERE activation_code = ? AND device_id = ?`,
           [activationCode, deviceId]);

    res.json({
      success: true,
      data: {
        type: row.type,
        expiresAt: row.expires_at,
        activatedAt: row.activated_at,
        lastSeen: row.last_seen
      }
    });
  });
});

// 获取激活码信息API（管理用）
app.get('/api/codes/:code', (req, res) => {
  const { code } = req.params;

  db.get(`SELECT ac.*, 
          (SELECT COUNT(*) FROM device_bindings WHERE activation_code = ac.code) as device_count
          FROM activation_codes ac WHERE code = ?`, [code], (err, row) => {
    if (err) {
      return res.status(500).json({ success: false, message: '服务器错误' });
    }

    if (!row) {
      return res.status(404).json({ success: false, message: '激活码不存在' });
    }

    res.json({
      success: true,
      data: row
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`激活服务器运行在端口 ${PORT}`);
  console.log(`API地址: http://localhost:${PORT}/api`);
});
