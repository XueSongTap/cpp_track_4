use chrono::Local;
use tokio::{
    self,
    runtime::Runtime,
    time::{self, Duration, Instant},
};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        println!("before: {}", now());

        let start = Instant::now() + Duration::from_secs(5);
        let interval = Duration::from_secs(1);
        let mut intv = time::interval_at(start, interval);

        time::sleep(Duration::from_secs(10)).await;
        intv.tick().await;
        println!("task 1: {}", now());
        intv.tick().await;
        println!("task 2: {}", now());
    });
}