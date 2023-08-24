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
        time::sleep(time::Duration::from_secs(2)).await;
        println!("local task1 done {}", now());
    });

    // task2要睡眠10秒，它将被第一次local_tasks.block_on在3秒后中断
    local_tasks.spawn_local(async {
        println!("local task2");
        time::sleep(time::Duration::from_secs(10)).await;
        println!("local task2 done, {}", now());
    });

    println!("before local tasks running: {}", now());
    local_tasks.block_on(&rt, async {
        tokio::task::spawn_local(async {
            println!("local task3");
            time::sleep(time::Duration::from_secs(3)).await;
            println!("local task3 done: {}", now());
        }).await.unwrap();
    });
    
    // 线程阻塞15秒，此时task2睡眠10秒的时间已经过去了，
    // 当再次进入LocalSet时，task2将可以直接被唤醒
    thread::sleep(std::time::Duration::from_secs(15));

    // 再次进入LocalSet
    local_tasks.block_on(&rt, async {
        // 先执行该任务，当遇到睡眠1秒的任务时，将出现任务切换，
        // 此时，调度器将调度task2，而此时task2已经睡眠完成
        println!("re enter localset context: {}", now());
        time::sleep(time::Duration::from_secs(1)).await;
        println!("re enter localset context done: {}", now());
    });
    println!("all local tasks done: {}", now());
}