use chrono::Local;
use tokio::{self, runtime::Runtime, time};

fn now() -> String {
    Local::now().format("%F %T").to_string()
}

fn main() {
    let rt = Runtime::new().unwrap();
    let local_tasks = tokio::task::LocalSet::new();

    local_tasks.spawn_local(async {
        println!("local task1");
        time::sleep(time::Duration::from_secs(2)).await;
        println!("local task1 done");
    });

    local_tasks.spawn_local(async {
        println!("local task2");
        time::sleep(time::Duration::from_secs(3)).await;
        println!("local task2 done");
    });

    println!("before local tasks running: {}", now());
    // LocalSet::block_on进入LocalSet上下文
    local_tasks.block_on(&rt, async {
        tokio::task::spawn_local(async {
            println!("local task3");
            time::sleep(time::Duration::from_secs(4)).await;
            println!("local task3 done");
        }).await.unwrap();
    });
    println!("all local tasks done: {}", now());
}