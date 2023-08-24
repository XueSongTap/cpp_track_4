use std::sync::Arc;
use tokio::{self,  runtime::Runtime, time::{self, Duration}};
fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let mutex = Arc::new(std::sync::Mutex::new(0));

        for i in 0..10 {
            let lock = mutex.clone();
            tokio::spawn(async move {
                let mut data = lock.lock().unwrap();
                *data += 1;
                println!("task: {}, data: {}", i, data);
            });
        }

        time::sleep(Duration::from_secs(1)).await;
    });
}
