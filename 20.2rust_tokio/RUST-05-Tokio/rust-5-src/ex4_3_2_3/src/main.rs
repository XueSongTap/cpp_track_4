use std::sync::Arc;
use tokio::{self, runtime::Runtime, sync::RwLock, time::{self, Duration}};

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let lock = Arc::new(RwLock::new(0));

        let lock1 = lock.clone();
        tokio::spawn(async move {
            let n = lock1.read().await;
            drop(n);  // 在申请第二把读锁前，先释放第一把读锁

            time::sleep(Duration::from_secs(2)).await;
            let nn = lock1.read().await;
            drop(nn);
        });

        time::sleep(Duration::from_secs(1)).await;
        let mut wn = lock.write().await;
        *wn = 2;
        drop(wn);
    });
}
