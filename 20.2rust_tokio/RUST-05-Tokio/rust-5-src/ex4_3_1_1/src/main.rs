use std::sync::Arc;
use tokio::{self, sync, runtime::Runtime, time::{self, Duration}};

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let mutex = Arc::new(sync::Mutex::new(0));

        for i in 0..10 {
            let lock = Arc::clone(&mutex);
            tokio::spawn(async move {
                let mut data = lock.lock().await;
                *data += 1;
                println!("task: {}, data: {}", i, data);
            });
        }

        time::sleep(Duration::from_secs(1)).await;
    });
}
