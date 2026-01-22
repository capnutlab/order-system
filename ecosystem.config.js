module.exports = {
    apps: [
      {
        name: "order-backend",
        script: "./backend/server.js",
        cwd: "./",
        watch: true,
        env: {
          NODE_ENV: "production",
        }
      },
      {
        name: "order-frontend",
        // npm.cmd を使わず、ViteのJavaScriptファイルを直接起動する
        script: "./node_modules/vite/bin/vite.js",
        args: "dev --host",
        cwd: "./frontend",
        watch: false,
        // Node.jsとして実行することを明示
        interpreter: "node",
        env: {
          NODE_ENV: "development",
        }
      }
    ]
  };