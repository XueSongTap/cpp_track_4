use chrono::Local;
use tokio::{self, runtime::Runtime, time};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    rt.block_on(async {
        let res = time::timeout(time::Duration::from_secs(5), async {
            println!("sleeping: {}", now());
            time::sleep(time::Duration::from_secs(6)).await;
            33
        });

        match res.await {
            Err(_) => println!("task timeout: {}", now()),
            Ok(data) => println!("get the res '{}': {}", data, now()),
        };
    });
}