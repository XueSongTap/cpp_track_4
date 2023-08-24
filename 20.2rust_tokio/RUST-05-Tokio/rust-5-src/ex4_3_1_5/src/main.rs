use std::sync::{Arc, Mutex};
use tokio::{ self, runtime::Runtime, sync, time::{self, Duration}};

fn main() {
    use std::sync::{Arc, Mutex, MutexGuard};

    async fn add_1(mutex: &Mutex<u64>) {
        {
        let mut lock = mutex.lock().unwrap();
        *lock += 1;
        }
        // 子任务，跨await，不引用父任务中的数据
        time::sleep(Duration::from_millis(10)).await;
    }
}
