use chrono::Local;
use tokio::{self, runtime::Runtime, time::{self, Duration, Instant}};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        println!("before: {}", now());

        // 计时器的起始计时点：此时此刻之后的5秒后
        let start = Instant::now() + Duration::from_secs(5);
        let interval = Duration::from_secs(1);
        let mut intv = time::interval_at(start, interval);

        // 该计时任务"阻塞"，直到5秒后被唤醒
        intv.tick().await;
        println!("task 1: {}", now());

        // 该计时任务"阻塞"，直到1秒后被唤醒
        intv.tick().await;
        println!("task 2: {}", now());

        // 该计时任务"阻塞"，直到1秒后被唤醒
        intv.tick().await;
        println!("task 3: {}", now());
    });
}