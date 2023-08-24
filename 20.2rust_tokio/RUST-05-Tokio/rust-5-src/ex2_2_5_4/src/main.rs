use chrono::Local;
use tokio::{self, runtime::Runtime, time};
use std::thread;
fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    let local_tasks = tokio::task::LocalSet::new();

    local_tasks.spawn_local(async {
        println!("local task1");
        time::sleep(time::Duration::from_secs(5)).await;
        println!("local task1 done {}", now());
    });

    println!("before local tasks running: {}", now());
    rt.block_on(async {
        local_tasks
            .run_until(async {
                println!("local task2");
                time::sleep(time::Duration::from_secs(3)).await;
                println!("local task2 done: {}", now());
            })
            .await;
    });

    thread::sleep(std::time::Duration::from_secs(10));
    rt.block_on(async {
        local_tasks
            .run_until(async {
                println!("local task3");
                tokio::task::yield_now().await;
                println!("local task3 done: {}", now());
            })
            .await;
    });
    println!("all local tasks done: {}", now());
}