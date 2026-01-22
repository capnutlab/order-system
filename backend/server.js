const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());

// 【修正箇所】保存先をボリュームマウントされた '/app/data' ディレクトリに変更
// これにより、Dockerコンテナ再起動後もデータが保持されます
// データディレクトリが存在しない場合は作成
const dataDir = './data';
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(path.join(dataDir, 'orders.db'), (err) => {
  if (err) {
    console.error("データベース接続エラー:", err.message);
  } else {
    console.log("SQLiteデータベースに接続しました。");
  }
});

db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT)");
  db.run("CREATE TABLE IF NOT EXISTS masters (id TEXT PRIMARY KEY, data TEXT)");
});

app.get('/api/orders', (req, res) => {
  db.all("SELECT data FROM orders", (err, rows) => {
    if (err) return res.status(500).send(err);
    
    const orders = rows.map(r => JSON.parse(r.data));
    const now = new Date();
    const limitDate = new Date();
    limitDate.setMonth(now.getMonth() - 1);

    // 期限切れデータを特定
    const expiredIds = orders
      .filter(o => o.status === '完了' && o.completedAt && new Date(o.completedAt) < limitDate)
      .map(o => o.id);

    // 期限切れがあればデータベースから削除（次回以降スッキリする）
    if (expiredIds.length > 0) {
      const placeholders = expiredIds.map(() => '?').join(',');
      db.run(`DELETE FROM orders WHERE id IN (${placeholders})`, expiredIds);
    }

    // 有効なデータだけを返す
    const activeOrders = orders.filter(o => !expiredIds.includes(o.id));
    res.json(activeOrders);
  });
});

app.post('/api/orders', (req, res) => {
  const order = req.body;
  db.run("INSERT OR REPLACE INTO orders (id, data) VALUES (?, ?)", [order.id, JSON.stringify(order)], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.get('/api/masters', (req, res) => {
  db.get("SELECT data FROM masters WHERE id = 'all'", (err, row) => {
    if (err) return res.status(500).send(err);
    res.json(row ? JSON.parse(row.data) : { clients: [], products: [], materials: [] });
  });
});

app.post('/api/masters', (req, res) => {
  db.run("INSERT OR REPLACE INTO masters (id, data) VALUES ('all', ?)", [JSON.stringify(req.body)], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.delete('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  db.run("DELETE FROM orders WHERE id = ?", [orderId], (err) => {
    if (err) return res.status(500).send(err);
    res.sendStatus(200);
  });
});

app.listen(3001, '0.0.0.0', () => console.log('Server running on port 3001'));