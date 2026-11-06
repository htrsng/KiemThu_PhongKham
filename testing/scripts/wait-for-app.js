const targets = [['http://localhost:5000/api/auth/me', 401], ['http://localhost:5173/login', 200]];
(async () => {
  const deadline = Date.now() + 60000;
  for (const [url, expectedStatus] of targets) {
    let ready = false;
    while (Date.now() < deadline) {
      try {
        const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
        if (response.status === expectedStatus) { ready = true; break; }
      } catch { /* Ứng dụng đang khởi động. */ }
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error(`Ứng dụng chưa sẵn sàng: ${url}`);
  }
  console.log('Backend và frontend đã sẵn sàng.');
})().catch((error) => { console.error(error.message); process.exitCode = 1; });
