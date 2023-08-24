use std::sync::Arc;
use tokio::sync::Barrier;
use tokio::{ self, runtime::Runtime, time::{self, Duration} };

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let barrier = Arc::new(Barrier::new(10));

        for i in 1..=15 {
            let b = barrier.clone();
            tokio::spawn(async move {
                println!("data before: {}", i);

                b.wait().await; // 15个任务中，多出5个任务将一直在此等待
                time::sleep(Duration::from_millis(10)).await;
                println!("data after: {}", i);
            });
        }
        time::sleep(Duration::from_secs(5)).await;
    });
}
