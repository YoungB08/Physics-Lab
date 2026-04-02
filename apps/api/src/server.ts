import { app } from './app.js';
import { env } from './config/env.js';
app.listen(env.CONG_API, () => {
  console.log(`API đang chạy tại http://localhost:${env.CONG_API}`);
});
