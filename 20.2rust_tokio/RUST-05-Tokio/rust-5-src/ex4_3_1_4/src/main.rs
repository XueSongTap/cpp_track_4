use std::sync::Arc;
use tokio::{ self, runtime::Runtime, sync::{Mutex, MutexGuard}, time::{self, Duration} };

async fn add_1(mutex: &Mutex<u64>) {
    let mut lock = mutex.lock().await;
    *lock += 1;
    time::sleep(Duration::from_millis(*lock)).await;
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let mutex = Arc::new(Mutex::new(0));
        for i in 0..10 {
            let lock = mutex.clone();
            tokio::spawn(async move {
                add_1(&lock).await;
            });
        }

        time::sleep(Duration::from_secs(1)).await;
    });
}
